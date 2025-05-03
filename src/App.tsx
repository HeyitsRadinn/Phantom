import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/electron-vite.animate.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="https://electron-vite.github.io" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <div className="absolute top-0 left-0 w-full h-[260px] z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 via-fuchsia-400/10 to-indigo-400/20 blur-2xl opacity-70 animate-gradient-shift-slow" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[60vw] h-[180px] rounded-full bg-gradient-to-r from-sky-400/30 via-purple-400/20 to-pink-400/20 blur-3xl opacity-60 animate-gradient-rotate" />
      </div>{" "}
    </>
  );
}

export default App;
