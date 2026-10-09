import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './App.css';

function App() {
  const [greetMessage, setGreetMessage] = useState('');
  const [name, setName] = useState('');

  async function greet(nameToGreet = '') {
    try {
      const greeting = await invoke<string>('greet', { name: nameToGreet });
      setGreetMessage(greeting);
    } catch (error) {
      console.error('Greet error:', error);
      setGreetMessage(`Error: ${error}`);
    }
  }

  useEffect(() => {
    greet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold">A</span>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold tracking-tight">Aventas</h1>
              <p className="text-slate-400 text-sm">Desktop Companion</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-slate-300 text-lg">Aventas Desktop Companion</p>
            <span className="inline-block px-3 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
              Development Build
            </span>
          </div>

          <div className="w-full max-w-md mt-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
              />
              <button
                onClick={() => greet(name)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Greet
              </button>
            </div>
            {greetMessage && <p className="mt-4 text-slate-300 text-sm">{greetMessage}</p>}
          </div>

          <footer className="mt-16 text-slate-500 text-sm">
            <p>Built with Tauri, React & TypeScript</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
