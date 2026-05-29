import React from 'react';
import MapPreview from './MapPreview';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../hooks/useAuth';

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  critical: 'bg-red-600 text-white dark:bg-red-800',
};

const statusColors = {
  pending: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-200',
  acknowledged: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-200',
  'in review': 'bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-200',
  'in progress': 'bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-200',
  resolved: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-200',
};

export default function ReportCard({
  report,
  expanded,
  onToggleExpand,
  onUpdateStatus,
  onUpdateProgress,
  onAssignDept
}) {
  const { user } = useAuth();
  const userRole = user?.user?.role || user?.role;
  const isStaffOrAdmin = userRole === 'staff' || userRole === 'admin';

  return (
    <article className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
      
      {/* Thumbnail */}
      <div className="w-full md:w-1/6 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
        {report.imageUrl ? (
          <img
            src={report.imageUrl}
            alt={report.title || 'Report Image'}
            className="w-full h-24 object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-24 flex items-center justify-center text-gray-400 text-sm">No photo</div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Header */}
        <div className="flex justify-between items-start md:items-center">
          <h3 className="text-lg font-semibold truncate">{report.title}</h3>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[report.priority] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
              {report.priority || 'Unknown'}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[report.status] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
              {report.status || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Reporter info */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Reported by <span className="font-medium">{report.reporter?.name || 'Anonymous'}</span> • {formatDate(report.createdAt)}
        </div>

        {/* Department info */}
        {report.assignedDepartment && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Assigned to: <span className="font-medium">{report.assignedDepartment}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs"
            >
              {expanded ? 'View Less' : 'View More'}
            </button>
          )}
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-2 flex flex-col gap-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">{report.description || 'No description provided.'}</p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <strong>Category:</strong> {report.category || 'N/A'}
            </div>
            {report.location?.coordinates && (
              <MapPreview
                lat={report.location.coordinates[1]}
                lng={report.location.coordinates[0]}
                address={report.location?.address}
              />
            )}

            {/* Staff/Admin Actions */}
            {isStaffOrAdmin && (
              <div className="mt-4 flex flex-wrap gap-4">
                {/* Progress Update Buttons */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm mb-1">Update Progress:</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onUpdateProgress(report._id, 'acknowledged')}
                      className={`px-3 py-1 text-xs rounded ${
                        report.status === 'acknowledged' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800'
                      }`}
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => onUpdateProgress(report._id, 'in review')}
                      className={`px-3 py-1 text-xs rounded ${
                        report.status === 'in review' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800'
                      }`}
                    >
                      In Review
                    </button>
                    <button
                      onClick={() => onUpdateProgress(report._id, 'in progress')}
                      className={`px-3 py-1 text-xs rounded ${
                        report.status === 'in progress' 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800'
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => onUpdateProgress(report._id, 'resolved')}
                      className={`px-3 py-1 text-xs rounded ${
                        report.status === 'resolved' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
                      }`}
                    >
                      Resolve
                    </button>
                  </div>
                </div>

                {/* Admin Only: Update Status and Department */}
                {userRole === 'admin' && (
                  <>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm mb-1">Update Status:</label>
                      <select
                        value={report.status}
                        onChange={(e) => onUpdateStatus(report._id, e.target.value)}
                        className="border p-2 w-full text-sm rounded-md dark:bg-gray-900 dark:text-gray-200"
                      >
                        <option value="pending">Pending</option>
                        <option value="acknowledged">Acknowledged</option>
                        <option value="in review">In Review</option>
                        <option value="in progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm mb-1">Assign Department:</label>
                      <select
                        value={report.assignedDepartment || ''}
                        onChange={(e) => onAssignDept(report._id, e.target.value)}
                        className="border p-2 w-full text-sm rounded-md dark:bg-gray-900 dark:text-gray-200"
                      >
                        <option value="">Select Department</option>
                        <option value="sanitation">Sanitation</option>
                        <option value="public-works">Public Works</option>
                        <option value="electricity">Electricity</option>
                        <option value="water">Water Department</option>
                        <option value="transportation">Transportation</option>
                        <option value="parks">Parks & Recreation</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}