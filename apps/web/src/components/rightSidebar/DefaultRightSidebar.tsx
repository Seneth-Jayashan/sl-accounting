import { Calendar, Bell} from 'lucide-react';

export default function DefaultRightSidebar() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-[calc(100vh-6rem)] overflow-y-auto">
      
      {/* --- User Profile Snippet --- */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-brand-aliceBlue flex items-center justify-center text-brand-prussian font-bold text-lg">
          A
        </div>
        <div>
          <h4 className="font-bold text-brand-prussian">Admin User</h4>
          <p className="text-xs text-gray-400">View Profile</p>
        </div>
        <button className="ml-auto p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell size={20} className="text-gray-400" />
        </button>
      </div>

      {/* --- Calendar Widget --- */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Calendar</h3>
          <Calendar size={16} className="text-gray-400" />
        </div>
        <div className="bg-brand-aliceBlue/50 rounded-2xl p-4 text-center">
          {/* Simple Calendar Placeholder */}
          <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-500 mb-2">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-2 text-sm font-bold text-gray-800">
            {/* Example Dates */}
            <span className="p-1 opacity-30">29</span>
            <span className="p-1 opacity-30">30</span>
            <span className="p-1 bg-brand-prussian text-white rounded-full">1</span>
            <span className="p-1">2</span>
            <span className="p-1">3</span>
            <span className="p-1">4</span>
            <span className="p-1">5</span>
          </div>
        </div>
      </div>

      {/* --- Quick Stats / Notifications --- */}
      <div>
        <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 items-start p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
              <div className="w-2 h-2 mt-2 rounded-full bg-brand-cerulean shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">New student registration</p>
                <p className="text-xs text-gray-400">2 mins ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}