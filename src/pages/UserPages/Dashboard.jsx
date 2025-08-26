import 'chart.js/auto';
import 'react-toastify/dist/ReactToastify.css';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  toast,
  ToastContainer,
} from 'react-toastify';

import {
  closestCorners,
  DndContext,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import Column from './Column';
import notificationSound from './notification.mp3';
import SortableItem from './SortableItem';
import UserSidebar from './UserSidebar';

const DEFAULT_FILTER_OPTION = "all";
const UserDashboard = () => {
  const [tasks, setTasks] = useState({
    "To Do": [],
    "In Progress": [],
    Completed: [],
  });

  const [notes, setNotes] = useState(localStorage.getItem("notes") || "");
  const audioRef = useRef(new Audio(notificationSound));

  // 🔹 Ensure page starts from top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const categorizedTasks = {
      "To Do": storedTasks.filter((task) => task.progress <= 40),
      "In Progress": storedTasks.filter((task) => task.progress > 40 && task.progress <= 80),
      Completed: storedTasks.filter((task) => task.progress > 80),
    };
    setTasks(categorizedTasks);
    checkDeadlines(storedTasks);
  }, []);

  useEffect(() => {
    localStorage.setItem("notes", notes);
  }, [notes]);

  const checkDeadlines = (tasks) => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    tasks.forEach((task) => {
      if (task.deadline === today) {
        showNotification(`🚨 Task Due Today: "${task.title}"`, "bg-red-500 text-white");
      } else if (task.deadline === tomorrowStr) {
        showNotification(`⏳ Task Due Tomorrow: "${task.title}"`, "bg-yellow-500 text-black");
      }
    });
  };

  const showNotification = (message, bgClass) => {
    toast(
      <div className={`p-2 rounded-lg shadow-md font-semibold text-lg ${bgClass}`}>
        {message}
      </div>,
      { position: "top-right", autoClose: 5000, hideProgressBar: false }
    );
    audioRef.current.play();
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceColumn = Object.keys(tasks).find((column) =>
      tasks[column].some((task) => task.id === active.id)
    );
    const targetColumn = Object.keys(tasks).find((column) => tasks[column].some((task) => task.id === over.id)) || over.id;

    if (!sourceColumn || !targetColumn || sourceColumn === targetColumn) return;

    setTasks((prevTasks) => {
      const updatedTasks = { ...prevTasks };
      const movedTask = updatedTasks[sourceColumn].find((task) => task.id === active.id);
      updatedTasks[sourceColumn] = updatedTasks[sourceColumn].filter((task) => task.id !== active.id);
      updatedTasks[targetColumn] = [...(updatedTasks[targetColumn] || []), movedTask];

      return updatedTasks;
    });

    localStorage.setItem("tasks", JSON.stringify([...tasks["To Do"], ...tasks["In Progress"], ...tasks["Completed"]]));
  };

  // Task Analytics Chart Data (Bar Graph)
  const chartData = {
    labels: ["To Do", "In Progress", "Completed"],
    datasets: [
      {
        label: "Number of Tasks",
        data: [
          tasks["To Do"].length,
          tasks["In Progress"].length,
          tasks.Completed.length,
        ],
        backgroundColor: ["#FF6384", "#FFCE56", "#36A2EB"],
      },
    ],
  };

  const [taskStatusFilter, setTaskStatusFilter] = useState(DEFAULT_FILTER_OPTION);

  const selectStatusFilter = (status) => () => {
    if (taskStatusFilter === status) {
      setTaskStatusFilter(DEFAULT_FILTER_OPTION);
    } else {
      setTaskStatusFilter(status);
    }
  };

  const filteredTasks = useMemo(() => {
    if (taskStatusFilter === DEFAULT_FILTER_OPTION) return tasks;

    return Object.fromEntries(
      Object.entries(tasks).filter(([key]) => key === taskStatusFilter)
    );
  }, [tasks, taskStatusFilter]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-gray-100">
      <UserSidebar />

      <div className="flex-1 p-6">
        <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          🚀 User Dashboard
        </h2>
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar />

        {/* Task filters Section */}
        <div className="mt-10 flex flex-row space-x-4">
          <button onClick={selectStatusFilter('To Do')} className={`${
            taskStatusFilter === 'To Do' ? 'bg-blue-500' : 'bg-gray-700'
          } text-white p-2 rounded-md transition-colors`}><CheckCircle className="inline mr-1" /> Show to-do tasks</button>
          <button onClick={selectStatusFilter('In Progress')} className={`${
            taskStatusFilter === 'In Progress' ? 'bg-blue-500' : 'bg-gray-700'
          } text-white p-2 rounded-md transition-colors`}><Clock className="inline mr-1" /> Show in-progress tasks</button>
          <button onClick={selectStatusFilter('Completed')} className={`${
            taskStatusFilter === 'Completed' ? 'bg-blue-500' : 'bg-gray-700'
          } text-white p-2 rounded-md transition-colors`}><XCircle className="inline mr-1" /> Show completed tasks</button>
        </div>

        {/* Kanban Board */}
        <div className="glassmorphism p-4 rounded-xl shadow-lg bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-lg border border-white/20">
          <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(filteredTasks).map((columnKey) => (
                <Column key={columnKey} title={columnKey} id={columnKey} className="w-[280px]">
                  <SortableContext items={filteredTasks[columnKey].map((task) => task.id)} strategy={verticalListSortingStrategy}>
                    {filteredTasks[columnKey].map((task) => (
                      <SortableItem key={task.id} id={task.id} task={task} />
                    ))}
                  </SortableContext>
                </Column>
              ))}
            </div>
          </DndContext>
        </div>

        {/* Task Analytics & Notes Section */}
        <div className="mt-10 flex flex-col lg:flex-row items-start gap-6">
          {/* Task Analytics Chart */}
          <div className="p-6 w-full lg:w-1/2 bg-white shadow-lg rounded-xl border border-gray-300">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 text-center tracking-wide uppercase">
              📊 Task Analytics
            </h2>
            <Bar data={chartData} />
          </div>

          {/* Notes */}
          <div className="p-6 w-full lg:w-[590px] bg-green-900 text-white rounded-xl border-[12px] border-[#8B4501] shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2 text-center">📌 Notes</h2>

            {/* Notes Input Field - Enlarged to match Task Analytics */}
            <textarea
              className="flex-1 bg-transparent border-none outline-none text-white text-lg p-7"
              placeholder="Write your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoFocus
              style={{
                fontFamily: "Chalkduster, Comic Sans MS, cursive",
                height: "320px",
                minHeight: "280px",
                textAlign: "left",
                resize: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
