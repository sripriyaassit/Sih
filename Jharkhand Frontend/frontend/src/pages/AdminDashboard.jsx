import React, { useEffect, useState } from 'react';
import API from '../services/api';
import ReportCard from '../components/ReportCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    department: 'all',
  });
  const [sortOrder, setSortOrder] = useState('newest');
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.user?.role || user?.role;
  const userDepartment = user?.user?.department || user?.department;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await API.get('/reports');
        setReports(res.data.data.reports);
        setFiltered(res.data.data.reports);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  // Counters - filter by department for staff users
  const filteredReports = userRole === 'staff' 
    ? reports.filter(r => r.assignedDepartment === userDepartment)
    : reports;
  
  const pendingCount = filteredReports.filter(r => r.status === 'pending').length;
  const acknowledgedCount = filteredReports.filter(r => r.status === 'acknowledged').length;
  const inReviewCount = filteredReports.filter(r => r.status === 'in review').length;
  const inProgressCount = filteredReports.filter(r => r.status === 'in progress').length;
  const resolvedCount = filteredReports.filter(r => r.status === 'resolved').length;

  useEffect(() => {
    let data = [...reports];

    // Staff users can only see their department's reports
    if (userRole === 'staff') {
      data = data.filter(r => r.assignedDepartment === userDepartment);
    }

    if (filters.status !== 'all') data = data.filter(r => r.status === filters.status);
    if (filters.priority !== 'all') data = data.filter(r => r.priority === filters.priority);
    if (filters.category !== 'all') data = data.filter(r => r.category === filters.category);
    if (filters.department !== 'all') data = data.filter(r => r.assignedDepartment === filters.department);

    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      data = data.filter(
        r => r.title?.toLowerCase().includes(lowerSearch) || r.description?.toLowerCase().includes(lowerSearch)
      );
    }

    if (sortOrder === 'newest') {
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    setFiltered(data);
  }, [filters, search, sortOrder, reports, userRole, userDepartment]);

  const updateStatus = async (id, status) => {
    try {
      await API.patch(`/reports/${id}/status`, { status });
      setReports(prev => prev.map(r => (r._id === id ? { ...r, status } : r)));
    } catch (e) {
      console.error(e);
    }
  };

  // NEW: Update progress function
  const updateProgress = async (id, progress) => {
    try {
      await API.patch(`/reports/${id}/progress`, { progress });
      setReports(prev => prev.map(r => (r._id === id ? { ...r, status: progress } : r)));
    } catch (e) {
      console.error(e);
    }
  };

  const assignToDept = async (id, department) => {
    try {
      await API.patch(`/reports/${id}/status`, { assignedDepartment: department });
      setReports(prev => prev.map(r => (r._id === id ? { ...r, assignedDepartment: department } : r)));
    } catch (e) {
      console.error(e);
    }
  };

  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => {
    setFilters({ status: 'all', priority: 'all', category: 'all', department: 'all' });
    setSearch('');
    setSortOrder('newest');
  };

  const departments = [...new Set(reports.map(r => r.assignedDepartment).filter(Boolean))];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">
        {userRole === 'staff' ? `${userDepartment} Department Dashboard` : 'Admin Dashboard'}
      </h2>

      {/* Counters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded dark:bg-yellow-900 dark:text-yellow-200">
          Pending: <span className="font-bold">{pendingCount}</span>
        </div>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded dark:bg-blue-900 dark:text-blue-200">
          Acknowledged: <span className="font-bold">{acknowledgedCount}</span>
        </div>
        <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded dark:bg-purple-900 dark:text-purple-200">
          In Review: <span className="font-bold">{inReviewCount}</span>
        </div>
        <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded dark:bg-indigo-900 dark:text-indigo-200">
          In Progress: <span className="font-bold">{inProgressCount}</span>
        </div>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded dark:bg-green-900 dark:text-green-200">
          Resolved: <span className="font-bold">{resolvedCount}</span>
        </div>
      </div>

      {/* Filters - hide department filter for staff users */}
      <div className="bg-white p-4 rounded-md shadow-md flex flex-wrap gap-4 mb-8 items-center dark:bg-gray-950 dark:text-gray-50">
        <input
          type="text"
          placeholder="Search title or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded p-2 w-full md:w-64 focus:outline-blue-500"
        />
        <select value={filters.status} onChange={e => updateFilter('status', e.target.value)} className="border rounded p-2">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in review">In Review</option>
          <option value="in progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={filters.priority} onChange={e => updateFilter('priority', e.target.value)} className="border rounded p-2">
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select value={filters.category} onChange={e => updateFilter('category', e.target.value)} className="border rounded p-2">
          <option value="all">All Categories</option>
          <option value="pothole">Pothole</option>
          <option value="streetlight">Streetlight</option>
          <option value="garbage">Garbage</option>
          <option value="water">Water</option>
          <option value="electricity">Electricity</option>
          <option value="other">Other</option>
        </select>
        
        {/* Hide department filter for staff users */}
        {userRole !== 'staff' && (
          <select value={filters.department} onChange={e => updateFilter('department', e.target.value)} className="border rounded p-2">
            <option value="all">All Departments</option>
            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        )}
        
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="border rounded p-2">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <button onClick={clearFilters} className="bg-gray-200 hover:bg-gray-300 text-sm px-4 py-2 rounded transition dark:text-gray-50 dark:bg-gray-950">Clear Filters</button>
        
        {/* Hide insights button for staff users */}
        {userRole === 'admin' && (
          <button onClick={() => navigate("/dashboard/admin/insights")} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded transition">
            View Insights
          </button>
        )}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex justify-center items-center h-40">Loading...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.length === 0 && <div className="text-gray-600 text-center">No reports found.</div>}
          {filtered.map(report => (
            <ReportCard
              key={report._id}
              report={report}
              expanded={expandedReportId === report._id}
              onToggleExpand={() => setExpandedReportId(expandedReportId === report._id ? null : report._id)}
              onUpdateStatus={updateStatus}
              onUpdateProgress={updateProgress}
              onAssignDept={assignToDept}
            />
          ))}
        </div>
      )}
    </div>
  );
}