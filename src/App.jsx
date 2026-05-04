import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Swaps from './pages/Swaps';
import Contact from './pages/Contact';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <main className="flex-grow pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/swaps" element={<Swaps />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
