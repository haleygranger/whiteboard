import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReactDOM from "react-dom/client";
import SignIn from "./SignIn";
import Whiteboard from "./Whiteboard";
import GuestSignIn from "./GuestSignIn";
import GuestSignInWithSession from "./GuestSignInWithSession";
import Loadboards from "./Loadboards";
import './App.css';

const App: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false); // Store authentication state

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn setAuthStatus={setIsAuth} />} />
        <Route path="/whiteboard" element={<Whiteboard isAuth={isAuth} />} />
        <Route path="/GuestSignIn" element={<GuestSignIn />} />
        <Route path="/GuestSignInSession" element={<GuestSignInWithSession />} />
        <Route path="/load-saved-boards" element={<Loadboards />} />
      </Routes>
    </BrowserRouter>
  );
};

// Render the App component in the root div
const container = document.getElementById('root')!;
ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;
