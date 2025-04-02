import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from "./SignIn";
import Whiteboard from "./Whiteboard";
import GuestSignIn from "./GuestSignIn";
import GuestSignInWithSession from "./GuestSignInWithSession";
import './App.css'

const container = document.getElementById('root')!;
ReactDOM.createRoot(container).render(
  <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/whiteboard" element={<Whiteboard />} />
          <Route path="/GuestSignIn" element={<GuestSignIn />} />
          <Route path="/GuestSignInSession" element={<GuestSignInWithSession />} />
        </Routes>
      </BrowserRouter>
  </React.StrictMode>
);
