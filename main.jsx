import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    signInAnonymously,
    signInWithCustomToken
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot,
    deleteDoc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { CheckCircle, Circle, Plus, LogIn, UserPlus, LogOut, Bell, Award, Sun } from 'lucide-react';

// --- Firebase Configuration ---
// IMPORTANT: Replace with your actual Firebase project configuration.
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
      };

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Motivational Quotes ---
const motivationalQuotes = [
    "The secret of getting ahead is getting started.",
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Don't watch the clock; do what it does. Keep going.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Dream bigger. Do bigger.",
    "Your limitation is only your imagination."
];

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState('dashboard'); // 'dashboard', 'login', 'signup'

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUser({ uid: currentUser.uid, ...userDocSnap.data() });
                } else {
                     // This case handles users who are authenticated but don't have a doc yet.
                    const newUserProfile = {
                        email: currentUser.email,
                        rewardPoints: 0,
                        createdAt: Timestamp.now()
                    };
                    await setDoc(userDocRef, newUserProfile);
                    setUser({ uid: currentUser.uid, ...newUserProfile });
                }
                setPage('dashboard');
            } else {
                 if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    try {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } catch (error) {
                        console.error("Error signing in with custom token:", error);
                        await signInAnonymously(auth);
                    }
                }
                setUser(null);
                setPage('login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setPage('login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }
    
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto">
                <Header user={user} onLogout={handleLogout} onNavClick={setPage} />
                <main className="mt-8">
                    {page === 'dashboard' && user ? (
                        <Dashboard user={user} setUser={setUser} />
                    ) : page === 'login' ? (
                        <AuthPage type="login" setPage={setPage} />
                    ) : page === 'signup' ? (
                        <AuthPage type="signup" setPage={setPage} />
                    ) : (
                        <AuthPage type="login" setPage={setPage} />
                    )}
                </main>
            </div>
        </div>
    );
}

// --- UI Components ---

function LoadingScreen() {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white">
            <div className="flex items-center space-x-3">
                 <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h1 className="text-2xl font-bold">TaskPulse</h1>
            </div>
            <p className="mt-4 text-gray-400">Loading your powerhouse...</p>
        </div>
    );
}


function Header({ user, onLogout, onNavClick }) {
    return (
        <header className="flex justify-between items-center p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700">
            <div className="flex items-center space-x-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
                    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h1 className="text-2xl font-bold tracking-tighter">TaskPulse</h1>
            </div>
            <nav>
                {user ? (
                    <button onClick={onLogout} className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-300">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                ) : (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => onNavClick('login')} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-300">
                            <LogIn size={18} />
                            <span>Login</span>
                        </button>
                        <button onClick={() => onNavClick('signup')} className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-300">
                            <UserPlus size={18} />
                            <span>Sign Up</span>
                        </button>
                    </div>
                )}
            </nav>
        </header>
    );
}

function AuthPage({ type, setPage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            if (type === 'signup') {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                // Create a user profile in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    rewardPoints: 0,
                    createdAt: Timestamp.now()
                });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center mb-2">{type === 'signup' ? 'Create Your Account' : 'Welcome Back'}</h2>
            <p className="text-center text-gray-400 mb-6">{type === 'signup' ? 'Join TaskPulse to boost your productivity.' : 'Log in to manage your tasks.'}</p>
            {error && <p className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-4 text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                    />
                </div>
                <button type="submit" disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center disabled:bg-blue-800 disabled:cursor-not-allowed">
                    {isSubmitting ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg> : (type === 'signup' ? 'Sign Up' : 'Login')}
                </button>
            </form>
            <p className="text-center text-sm text-gray-400 mt-6">
                {type === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                <button onClick={() => setPage(type === 'signup' ? 'login' : 'signup')} className="font-medium text-blue-400 hover:underline">
                    {type === 'signup' ? 'Log In' : 'Sign Up'}
                </button>
            </p>
        </div>
    );
}


function Dashboard({ user, setUser }) {
    const [tasks, setTasks] = useState([]);
    const [dailyQuote, setDailyQuote] = useState('');

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const tasksData = [];
            querySnapshot.forEach((doc) => {
                tasksData.push({ id: doc.id, ...doc.data() });
            });
            // Sort tasks: incomplete first, then by creation date
            tasksData.sort((a, b) => {
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                return b.createdAt.toDate() - a.createdAt.toDate();
            });
            setTasks(tasksData);
        });

        // Set daily quote
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        setDailyQuote(motivationalQuotes[dayOfYear % motivationalQuotes.length]);
        
        // Request notification permission
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }

        return () => unsubscribe();
    }, [user]);
    
    const completedTasks = tasks.filter(task => task.completed).length;
    const activeTasks = tasks.length - completedTasks;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<CheckCircle />} title="Active Tasks" value={activeTasks} color="blue" />
                <StatCard icon={<Award />} title="Reward Points" value={user.rewardPoints} color="yellow" />
                <StatCard icon={<Sun />} title="Tasks Completed" value={completedTasks} color="green" />
            </div>
            <QuoteCard quote={dailyQuote} />
            <TaskSection tasks={tasks} user={user} setUser={setUser} />
        </div>
    );
}

function StatCard({ icon, title, value, color }) {
    const colors = {
        blue: 'from-blue-500 to-indigo-600',
        yellow: 'from-yellow-400 to-orange-500',
        green: 'from-green-400 to-emerald-500',
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} p-6 rounded-2xl shadow-lg flex items-center space-x-4`}>
            <div className="bg-white/20 p-3 rounded-full">
                {React.cloneElement(icon, { size: 28, className: "text-white" })}
            </div>
            <div>
                <p className="text-white/80 text-sm">{title}</p>
                <p className="text-3xl font-bold">{value}</p>
            </div>
        </div>
    );
}

function QuoteCard({ quote }) {
    return (
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 text-center">
            <p className="text-lg italic text-gray-300">"{quote}"</p>
        </div>
    );
}

function TaskSection({ tasks, user, setUser }) {
    const [newTask, setNewTask] = useState('');
    const [dueDate, setDueDate] = useState('');
    
    const handleAddTask = async (e) => {
        e.preventDefault();
        if (newTask.trim() === '' || !user) return;

        const taskData = {
            text: newTask,
            completed: false,
            createdAt: Timestamp.now(),
            userId: user.uid,
        };

        if (dueDate) {
            taskData.dueDate = Timestamp.fromDate(new Date(dueDate));
        }

        await addDoc(collection(db, "tasks"), taskData);
        setNewTask('');
        setDueDate('');
    };

    const toggleTask = async (task) => {
        const taskRef = doc(db, "tasks", task.id);
        const userRef = doc(db, "users", user.uid);
        const pointsToAdd = task.completed ? -10 : 10;

        await updateDoc(taskRef, { completed: !task.completed });

        const newPoints = Math.max(0, user.rewardPoints + pointsToAdd);
        await updateDoc(userRef, { rewardPoints: newPoints });

        setUser(prevUser => ({ ...prevUser, rewardPoints: newPoints }));

        if (!task.completed) {
            new Notification("Task Completed!", {
                body: `Great job! You earned 10 points for completing: "${task.text}"`,
                icon: '/favicon.ico' 
            });
        }
    };

    const deleteTask = async (taskId) => {
        await deleteDoc(doc(db, "tasks", taskId));
    };

    return (
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-2xl font-bold mb-4">Your Tasks</h3>
            <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row items-center gap-3 mb-6">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="What's your next task?"
                    className="flex-grow w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full sm:w-auto px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button type="submit" className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors duration-300">
                    <Plus size={20} />
                    <span>Add Task</span>
                </button>
            </form>
            <div className="space-y-3">
                {tasks.length > 0 ? tasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                )) : (
                    <p className="text-center text-gray-400 py-4">No tasks yet. Add one to get started!</p>
                )}
            </div>
        </div>
    );
}

function TaskItem({ task, onToggle, onDelete }) {
    const [isDue, setIsDue] = useState(false);

    const checkDueDate = useCallback(() => {
        if (task.dueDate && !task.completed) {
            const now = new Date();
            const dueDate = task.dueDate.toDate();
            const timeDiff = dueDate.getTime() - now.getTime();
            
            if (timeDiff > 0 && timeDiff < 5 * 60 * 1000) { // 5 minutes
                 if (Notification.permission === 'granted') {
                    new Notification('Task Reminder', {
                        body: `Your task "${task.text}" is due soon!`,
                        icon: '/favicon.ico'
                    });
                }
            }
            setIsDue(now > dueDate);
        }
    }, [task]);

    useEffect(() => {
        checkDueDate();
        const interval = setInterval(checkDueDate, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [checkDueDate]);

    return (
        <div className={`flex items-center p-4 rounded-lg transition-all duration-300 ${task.completed ? 'bg-gray-700/50' : 'bg-gray-700'}`}>
            <button onClick={() => onToggle(task)} className="mr-4">
                {task.completed ? <CheckCircle size={24} className="text-green-400" /> : <Circle size={24} className="text-gray-400 hover:text-blue-400" />}
            </button>
            <div className="flex-grow">
                <p className={`text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.text}</p>
                {task.dueDate && (
                    <div className={`flex items-center text-sm mt-1 ${isDue && !task.completed ? 'text-red-400' : 'text-gray-400'}`}>
                        <Bell size={14} className="mr-1" />
                        <span>{task.dueDate.toDate().toLocaleString()}</span>
                    </div>
                )}
            </div>
            <button onClick={() => onDelete(task.id)} className="ml-4 text-gray-500 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    );
}
