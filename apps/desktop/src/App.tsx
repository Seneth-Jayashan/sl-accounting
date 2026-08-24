import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-100 font-sans p-6">
      <div className="w-full max-w-2xl bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl p-10 shadow-2xl flex flex-col items-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 mb-8 text-center">
          Welcome to Tauri + React
        </h1>

        <div className="flex justify-center gap-8 mb-8 items-center">
          <a href="https://vite.dev" target="_blank" className="hover:scale-110 transition-transform duration-300">
            <img src="/vite.svg" className="w-16 h-16 drop-shadow-[0_0_15px_rgba(100,108,255,0.5)]" alt="Vite logo" />
          </a>
          <a href="https://tauri.app" target="_blank" className="hover:scale-110 transition-transform duration-300">
            <img src="/tauri.svg" className="w-16 h-16 drop-shadow-[0_0_15px_rgba(36,200,219,0.5)]" alt="Tauri logo" />
          </a>
          <a href="https://react.dev" target="_blank" className="hover:scale-110 transition-transform duration-300">
            <img src={reactLogo} className="w-16 h-16 drop-shadow-[0_0_15px_rgba(97,218,251,0.5)]" alt="React logo" />
          </a>
        </div>

        <p className="text-neutral-400 mb-8 text-center text-sm font-medium tracking-wide">
          Click on the Tauri, Vite, and React logos to learn more.
        </p>

        <form
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            greet();
          }}
        >
          <input
            id="greet-input"
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-5 py-3 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Enter a name..."
          />
          <button 
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all duration-300 active:scale-95"
          >
            Greet
          </button>
        </form>

        {greetMsg && (
          <div className="mt-8 px-6 py-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-300 font-medium animate-in fade-in slide-in-from-bottom-4 duration-500">
            {greetMsg}
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
