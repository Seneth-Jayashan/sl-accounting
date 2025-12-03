// components/DefaultRightSidebar.tsx
import { 
  CalendarIcon, 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon 
} from "@heroicons/react/24/outline";

// Define the data types
export type Task = {
  id: number;
  title: string;
  subtitle: string;
  type: 'urgent' | 'completed' | 'info';
};

interface Props {
  scheduleDate?: string;
  scheduleTitle?: string;
  scheduleTime?: string;
  tasks?: Task[];
}

export default function DefaultRightSidebar({ 
  scheduleDate = "NOV 25",
  scheduleTitle = "Costing Revision",
  scheduleTime = "04:00 PM - 06:00 PM",
  tasks = []
}: Props) {
  return (
    <div className="space-y-6">
      
      {/* Widget 1: Calendar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Schedule</h3>
          <CalendarIcon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3 mb-3">
          <div className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-xs text-center">
            <div>{scheduleDate.split(' ')[0]}</div>
            <div>{scheduleDate.split(' ')[1]}</div>
          </div>
          <div>
            <div className="text-sm font-bold text-[#0b2540]">{scheduleTitle}</div>
            <div className="text-xs text-gray-500">{scheduleTime}</div>
          </div>
        </div>
        <button className="w-full py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          View Full Calendar
        </button>
      </div>

      {/* Widget 2: Tasks (Dynamic Mapping) */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Tasks</h3>
          <div className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {tasks.filter(t => t.type === 'urgent').length}
          </div>
        </div>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3">
              {task.type === 'urgent' && <ExclamationCircleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />}
              {task.type === 'completed' && <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
              {task.type === 'info' && <BellIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />}
              
              <div>
                <div className={`text-sm font-medium ${task.type === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {task.title}
                </div>
                <div className="text-xs text-gray-400">{task.subtitle}</div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <div className="text-xs text-gray-400">No pending tasks</div>}
        </div>
      </div>

    </div>
  );
}