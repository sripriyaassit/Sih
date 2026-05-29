import Report from '../models/Report.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

// Create report (protected)
export const createReport = catchAsync(async (req, res, next) => {
  const { title, description, category, priority, address, lat, lng, assignedDepartment } = req.body;
  if (!title || !lat || !lng) return next(new AppError('title, lat, lng are required.', 400));

  let imageUrl = '';
  if (req.file) {
    const uploadRes = await uploadBufferToCloudinary(req.file.buffer, 'reports');
    imageUrl = uploadRes.secure_url;
  }

  const report = await Report.create({
    title,
    description,
    category,
    priority,
    imageUrl,
    reporter: req.user._id,
    assignedDepartment,
    location: { type: 'Point', coordinates: [Number(lng), Number(lat)], address }
  });

  res.status(201).json({ status: 'success', data: { report } });
});

// Get reports (protected) - with role-based filtering
export const getReports = catchAsync(async (req, res) => {
  const { status, category, priority, department, nearLng, nearLat, maxDistance = 2000 } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;

  // Role-based restrictions
  if (req.user.role === 'citizen') {
    filter.reporter = req.user._id; // citizen sees only their reports
  } else if (req.user.role === 'staff') {
    filter.assignedDepartment = req.user.department; // staff sees their department reports
  } else if (req.user.role === 'admin' && department) {
    filter.assignedDepartment = department; // admin can filter by department
  }

  let query = Report.find(filter).populate('reporter', 'name email');

  if (nearLng && nearLat) {
    query = query.where('location').near({
      center: { type: 'Point', coordinates: [Number(nearLng), Number(nearLat)] },
      maxDistance: Number(maxDistance),
      spherical: true
    });
  }

  const reports = await query.sort('-createdAt');
  res.json({ status: 'success', results: reports.length, data: { reports } });
});

// Get single report with restrictions
export const getReportById = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id).populate('reporter', 'name email');
  if (!report) return next(new AppError('Report not found', 404));

  // Citizen restriction: only their own reports
  if (req.user.role === 'citizen' && report.reporter._id.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to access this report.', 403));
  }

  // Staff restriction: only their department reports
  if (req.user.role === 'staff' && report.assignedDepartment !== req.user.department) {
    return next(new AppError('You do not have permission to access this report.', 403));
  }

  res.json({ status: 'success', data: { report } });
});

// Update status / assigned dept
export const updateReportStatus = catchAsync(async (req, res, next) => {
  const { status, assignedDepartment } = req.body;
  const allowedStatuses = ['pending', 'acknowledged', 'in review', 'in progress', 'resolved'];

  if (req.user.role === 'staff' && assignedDepartment) {
    return next(new AppError('Staff users cannot change department assignment.', 403));
  }

  if (status && !allowedStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError('Report not found', 404));

  if (req.user.role === 'staff' && report.assignedDepartment !== req.user.department) {
    return next(new AppError('You do not have permission to update this report.', 403));
  }

  const updatedReport = await Report.findByIdAndUpdate(
    req.params.id,
    { $set: { ...(status && { status }), ...(assignedDepartment && { assignedDepartment }) } },
    { new: true }
  );

  res.json({ status: 'success', data: { report: updatedReport } });
});

// Update progress (for staff)
export const updateReportProgress = catchAsync(async (req, res, next) => {
  const { progress } = req.body;
  const allowedProgress = ['acknowledged', 'in review', 'in progress', 'resolved'];

  if (!allowedProgress.includes(progress)) {
    return next(new AppError('Invalid progress value', 400));
  }

  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError('Report not found', 404));

  if (req.user.role === 'staff' && report.assignedDepartment !== req.user.department) {
    return next(new AppError('You do not have permission to update this report.', 403));
  }

  const updatedReport = await Report.findByIdAndUpdate(
    req.params.id,
    { status: progress },
    { new: true }
  );

  res.json({ status: 'success', data: { report: updatedReport } });
});

// Delete report (admin only)
export const deleteReport = catchAsync(async (req, res, next) => {
  const report = await Report.findByIdAndDelete(req.params.id);
  if (!report) return next(new AppError('Report not found', 404));
  res.json({ status: 'success', data: null });
});
