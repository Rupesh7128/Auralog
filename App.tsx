import React, { useState, useEffect } from 'react';
import { Button } from './components/Button';
import { ImageUploader } from './components/ImageUploader';
import { analyzeOutfit } from './services/geminiService';
import { AnalysisResult, ViewState, MOCK_INITIAL_CREDITS, SavedOutfit } from './types';
import { auth, signInWithGoogle, signInWithDemo, logout } from './services/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

// --- Components ---

const Marquee = ({ text, reversed = false }: { text: string, reversed?: boolean }) => (
  <div className="w-full overflow-hidden bg-[#1a1a1a] text-[#fcfbf9] py-3 border-y border-[#1a1a1a]">
    <div className={`whitespace-nowrap flex gap-8 items-center ${reversed ? 'animate-marquee-reverse' : 'animate-marquee'}`} style={{ animationDirection: reversed ? 'reverse' : 'normal' }}>
      {[...Array(10)].map((_, i) => (
        <span key={i} className="text-sm font-display font-bold tracking-[0.2em] uppercase">
          {text} •
        </span>
      ))}
    </div>
  </div>
);

interface HeaderProps {
    user: User | null;
    onViewChange: (v: ViewState) => void;
    credits: number;
    onLogout: () => void;
    onLogin: () => void;
    onDemoLogin: () => void;
}

const Header = ({ user, onViewChange, credits, onLogout, onLogin, onDemoLogin }: HeaderProps) => (
    <header className="sticky top-0 z-40 w-full bg-[#fcfbf9]/90 backdrop-blur-xl border-b border-[#1a1a1a]/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
            <div 
              className="text-2xl font-display font-bold cursor-pointer tracking-tighter hover:opacity-70 transition-opacity flex items-center gap-2" 
              onClick={() => onViewChange(ViewState.LANDING)}
            >
              AuraLog
            </div>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
              <div className="flex items-center gap-4">
                 {/* Credit Display */}
                 <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-stone-200 bg-white rounded-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${credits > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-900">
                        {credits} Credits
                    </span>
                 </div>

                 <div 
                    className="hidden md:flex items-center gap-2 bg-stone-100 rounded-full pr-3 pl-1 py-1 cursor-pointer hover:bg-stone-200 transition-colors"
                    onClick={() => onViewChange(ViewState.PROFILE)}
                 >
                    <img src={user.photoURL || ''} alt="Profile" className="w-6 h-6 rounded-full object-cover grayscale" />
                    <span className="text-[10px] font-bold uppercase text-stone-900">{user.displayName?.split(' ')[0]}</span>
                 </div>
                 <Button variant="ghost" size="sm" onClick={onLogout} className="text-xs">Sign Out</Button>
              </div>
          ) : (
              <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={onDemoLogin} className="text-xs text-stone-500 hover:text-stone-900">
                      Demo
                  </Button>
                  <Button variant="primary" size="sm" onClick={onLogin} className="text-xs h-10 px-6">
                      Sign In
                  </Button>
              </div>
          )}
        </div>
      </div>
    </header>
);

// --- Sections ---

const FeatureCard = ({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) => (
    <div className="p-8 border border-stone-200 hover:border-stone-900 transition-colors duration-500 bg-white">
        <div className="w-12 h-12 bg-stone-50 flex items-center justify-center mb-6 text-stone-900">
            {icon}
        </div>
        <h3 className="font-serif text-2xl italic mb-3">{title}</h3>
        <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
    </div>
);

const SampleShowcase = () => (
    <section id="samples" className="py-24 bg-[#1a1a1a] text-[#fcfbf9]">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                <div>
                     <span className="text-xs font-display font-bold tracking-widest text-stone-500 uppercase mb-2 block">The Transformation</span>
                    <h2 className="text-4xl md:text-6xl font-serif italic">Before & After</h2>
                </div>
                <p className="text-stone-400 max-w-md text-sm mt-6 md:mt-0 leading-relaxed">
                    See how AuraLog analyzes your daily fits—from street style to coffee runs—turning them into viral moments.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Card 1 - Striking Flash Photography Style - UPDATED IMAGE */}
                <div className="group relative">
                    <div className="aspect-[4/5] overflow-hidden relative bg-stone-800">
                         <img src="https://images.unsplash.com/photo-1588117305388-c2631a279f82?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 grayscale-[0.2]" alt="Flash Photography Street Style" />
                         <div className="absolute bottom-6 left-6 bg-white text-black px-4 py-3 max-w-xs shadow-2xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                             <p className="font-serif italic text-lg">"Caught in 4k. Main character energy only."</p>
                             <div className="flex gap-2 mt-2">
                                 <span className="w-3 h-3 bg-[#1a1a1a]"></span>
                                 <span className="w-3 h-3 bg-[#991b1b]"></span>
                                 <span className="w-3 h-3 bg-[#e5e5e5]"></span>
                             </div>
                         </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center border-t border-white/20 pt-4">
                        <span className="text-xs uppercase tracking-widest text-stone-400">Input: Night Out</span>
                        <span className="text-xs uppercase tracking-widest text-white">Result: Hype Caption</span>
                    </div>
                </div>

                 {/* Card 2 - Clean Architectural/Editorial - UPDATED IMAGE */}
                 <div className="group relative md:translate-y-12">
                    <div className="aspect-[4/5] overflow-hidden relative bg-stone-800">
                         <img src="https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 grayscale-[0.1]" alt="Minimalist Fashion Analysis" />
                         <div className="absolute bottom-6 left-6 bg-white text-black px-4 py-3 max-w-xs shadow-2xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                             <p className="font-serif italic text-lg">"Texture over everything. Soft sculpt vs hard lines."</p>
                             <p className="text-[10px] uppercase tracking-widest mt-2 text-stone-500">Keywords: Minimalist, Sculptural, Neutral</p>
                         </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center border-t border-white/20 pt-4">
                        <span className="text-xs uppercase tracking-widest text-stone-400">Input: OOTD</span>
                        <span className="text-xs uppercase tracking-widest text-white">Result: Style Metrics</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

// --- Main App ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [credits, setCredits] = useState<number>(MOCK_INITIAL_CREDITS.remaining);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);

  useEffect(() => {
      if (!auth) return;
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
              setUser(currentUser);
          } else {
              setUser(null);
          }
      });
      return () => unsubscribe();
  }, []);

  // Load credits and saved outfits from local storage
  useEffect(() => {
      const storedCredits = localStorage.getItem('auralog_credits');
      if (storedCredits) {
          setCredits(parseInt(storedCredits, 10));
      } else {
          localStorage.setItem('auralog_credits', MOCK_INITIAL_CREDITS.remaining.toString());
      }

      const storedOutfits = localStorage.getItem('auralog_saved_outfits');
      if (storedOutfits) {
          try {
              setSavedOutfits(JSON.parse(storedOutfits));
          } catch (e) {
              console.error("Failed to parse saved outfits");
              setSavedOutfits([]);
          }
      }
  }, []);

  const updateCredits = (newAmount: number) => {
      setCredits(newAmount);
      localStorage.setItem('auralog_credits', newAmount.toString());
  };

  const handleSaveToProfile = () => {
      if (result && imagePreview) {
          // Use the image string itself to check for duplicates to prevent spamming save
          if (savedOutfits.some(o => o.image === imagePreview)) {
             alert("You've already logged this specific look!");
             return;
          }

          const newOutfit: SavedOutfit = {
              id: Date.now().toString(),
              timestamp: Date.now(),
              image: imagePreview,
              analysis: result
          };
          
          const updatedOutfits = [newOutfit, ...savedOutfits];
          setSavedOutfits(updatedOutfits);
          localStorage.setItem('auralog_saved_outfits', JSON.stringify(updatedOutfits));
          alert("Look logged successfully!");
      }
  };

  const handleViewSavedOutfit = (outfit: SavedOutfit) => {
      setImagePreview(outfit.image);
      setResult(outfit.analysis);
      setView(ViewState.RESULTS);
  };

  const handleDeleteSavedOutfit = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm("Are you sure you want to remove this fit from your log?")) {
          const updated = savedOutfits.filter(o => o.id !== id);
          setSavedOutfits(updated);
          localStorage.setItem('auralog_saved_outfits', JSON.stringify(updated));
      }
  };

  useEffect(() => {
    if (view === ViewState.ANALYZING) {
        const interval = setInterval(() => {
            setLoadingPhase(p => (p + 1) % 4);
        }, 1500);
        return () => clearInterval(interval);
    }
  }, [view]);

  const performLogin = async () => {
    try {
        const loggedInUser = await signInWithGoogle();
        if (loggedInUser) {
            setUser(loggedInUser);
            setView(ViewState.UPLOAD);
        }
    } catch (e: any) {
        console.error("Login failed", e);
        if (e?.code === 'auth/unauthorized-domain') {
            alert("Login failed: This domain is not authorized in your Firebase Console. Please add it to Authentication > Settings > Authorized Domains.");
        } else if (e?.code !== 'auth/popup-closed-by-user') {
            alert("Login failed: " + (e?.message || "Unknown error"));
        }
    }
  };

  const handleStart = async () => {
    if (user) {
      setView(ViewState.UPLOAD);
    } else {
      await performLogin();
    }
  };

  const handleDemoLogin = async () => {
      const demoUser = await signInWithDemo();
      setUser(demoUser);
      setView(ViewState.UPLOAD);
  };

  const handleLogout = async () => {
      await logout();
      setUser(null);
      setView(ViewState.LANDING);
  };

  const handleImageSelect = async (base64: string, preview: string, mimeType: string) => {
    if (credits <= 0) {
        alert("You have 0 credits remaining. Please recharge your aura credits to continue.");
        setView(ViewState.LANDING);
        setTimeout(() => {
            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return;
    }

    setImagePreview(preview);
    setView(ViewState.ANALYZING);
    setError(null);

    try {
      const data = await analyzeOutfit(base64, mimeType);
      updateCredits(credits - 1);
      setResult(data);
      setView(ViewState.RESULTS);
    } catch (err) {
      console.error(err);
      setError("We couldn't analyze this look. Please try a different photo.");
      setView(ViewState.UPLOAD);
    }
  };

  const handleCheckout = () => {
      updateCredits(100); // Give them plenty of credits for "buying"
      window.open('https://test.checkout.dodopayments.com/buy/pdt_oksp42l45Y9dK95wOzXkX?quantity=1', '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // --- Views ---

  const LandingView = () => (
    <>
      {/* Hero */}
      <div className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 md:px-6 overflow-hidden pt-20 bg-[#fcfbf9]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-stone-200 to-transparent rounded-full blur-[120px] opacity-40 -z-10"></div>

        {/* Mobile Background Image - Increased visibility */}
        <div className="lg:hidden absolute inset-0 z-0 opacity-30 pointer-events-none">
             <img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover grayscale" alt="Background" />
        </div>

        {/* Hero Images Grid (Desktop) - Increased Opacity */}
        <div className="hidden lg:block absolute left-12 top-1/2 -translate-y-1/2 w-72 h-[500px] rotate-[-6deg] opacity-100 hover:scale-105 transition-all duration-700 z-0 shadow-2xl">
            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80" className="w-full h-full object-cover grayscale-[0.1]" alt="Fashion Editorial 1" />
        </div>
        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-72 h-[500px] rotate-[6deg] opacity-100 hover:scale-105 transition-all duration-700 z-0 shadow-2xl">
            <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80" className="w-full h-full object-cover grayscale-[0.1]" alt="Fashion Editorial 2" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
            <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#1a1a1a]/60 mb-8 border border-[#1a1a1a]/10 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm">
            The Content OS for Fashion
            </span>
            
            <h1 className="text-6xl md:text-9xl font-display font-bold mb-2 text-[#1a1a1a] leading-[0.85] text-center tracking-tighter">
            AuraLog
            </h1>
            <h2 className="text-xl md:text-3xl font-light font-sans tracking-tight text-center mb-12 max-w-2xl text-stone-600 mt-6">
                Analyze your fit. Quantify your Aura. <br/>
                <span className="italic font-serif text-stone-900">Captions, hashtags, and style metrics on autopilot.</span>
            </h2>
            
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto px-4">
            <Button size="lg" onClick={handleStart} className="h-14 w-full md:w-64 text-lg shadow-2xl shadow-stone-300">
                {user ? 'New Analysis' : 'Check Aura'}
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('samples')?.scrollIntoView({behavior: 'smooth'})} className="h-14 w-full md:w-64 text-lg">
                View Showcase
            </Button>
            </div>
        </div>

        {/* Social Proof Logos - Solid Black */}
        <div className="mt-16 flex items-center justify-center gap-8 md:gap-16 text-black relative z-10">
             {/* Instagram */}
             <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 md:h-10 md:w-10 hover:scale-110 transition-transform" aria-label="Instagram">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
             </svg>
             
             {/* TikTok */}
             <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 md:h-10 md:w-10 hover:scale-110 transition-transform" aria-label="TikTok">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
             </svg>

             {/* Snapchat */}
             <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 md:h-10 md:w-10 hover:scale-110 transition-transform" aria-label="Snapchat">
                 <path d="M12.04 1.6c-4.02 0-6.61 2.67-6.67 6.53-.02 1.17.29 2.27.72 3.17l-.61.56c-1.07.99-1.26 2.25-.31 3.12.28.25.64.35 1.01.31l.31-.04c.03.25.09.5.19.74.54 1.32 2.11 1.85 3.32 1.13.26-.16.48-.2.77-.2 1.05 0 1.05.65 1.27.65.21 0 .22-.65 1.27-.65.29 0 .51.05.77.2 1.21.72 2.78.19 3.32-1.13.1-.24.16-.49.19-.74l.31.04c.37.04.73-.06 1.01-.31.95-.87.76-2.13-.31-3.12l-.61-.56c.43-.9.74-2 .72-3.17-.06-3.86-2.65-6.53-6.67-6.53z"/>
             </svg>

             {/* Reddit */}
             <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 md:h-10 md:w-10 hover:scale-110 transition-transform" aria-label="Reddit">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
             </svg>
        </div>
      </div>

      <Marquee text="Aura Analytics • Trend Forecasting • Color Theory • Engagement Optimized" />

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-stone-200 border border-stone-200">
                 <FeatureCard 
                    title="Style Forensics" 
                    desc="Our AI identifies fabrics, silhouettes, and micro-trends (like Gorpcore or Mob Wife Aesthetic) instantly."
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                 />
                 <FeatureCard 
                    title="Viral Copywriting" 
                    desc="Stop overthinking. Get 4 distinct caption options tailored for engagement, from 'Minimalist' to 'Hype'."
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>}
                 />
                 <FeatureCard 
                    title="Hashtag Log" 
                    desc="We analyze the visual data to generate niche, high-conversion hashtags that actually get you discovered."
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" /></svg>}
                 />
             </div>
          </div>
      </section>

      <SampleShowcase />

      {/* Pricing */}
      <section id="pricing" className="py-32 bg-[#fcfbf9] flex justify-center px-4">
          <div className="w-full max-w-4xl bg-white border border-stone-200 shadow-2xl p-8 md:p-16 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2">
                  Launch Offer
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
                  <div>
                      <h2 className="text-5xl font-serif italic mb-2">Pro Aura</h2>
                      <p className="text-stone-500">Join the high-frequency aura.</p>
                  </div>
                  <div className="text-right mt-6 md:mt-0">
                      <div className="text-6xl font-bold font-display">$5</div>
                      <div className="text-stone-400 text-sm uppercase tracking-widest">Per Month</div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <ul className="space-y-4">
                      {['Unlimited AI Analysis', 'Color Palette Extraction', 'Trend Forecasting'].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-medium">
                              <span className="w-1.5 h-1.5 bg-black rounded-full"></span> {item}
                          </li>
                      ))}
                  </ul>
                   <ul className="space-y-4">
                      {['Viral Caption Generator', 'Niche Hashtag Strategy', 'Priority Support'].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-medium">
                              <span className="w-1.5 h-1.5 bg-black rounded-full"></span> {item}
                          </li>
                      ))}
                  </ul>
              </div>

              <Button onClick={handleCheckout} className="w-full h-16 text-lg bg-black text-white hover:bg-stone-800">
                  Start Membership
              </Button>
              <p className="text-center text-xs text-stone-400 mt-4">
                  Secured by Dodo Payments. Cancel anytime.
              </p>
          </div>
      </section>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-200">
        <Header 
            user={user} 
            onViewChange={setView} 
            credits={credits} 
            onLogout={handleLogout} 
            onLogin={performLogin} 
            onDemoLogin={handleDemoLogin} 
        />
        
        <main>
            {view === ViewState.LANDING && <LandingView />}
            
            {view === ViewState.UPLOAD && (
                <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
                    <h2 className="text-3xl font-serif italic mb-8 text-center">Upload your look</h2>
                    <ImageUploader onImageSelect={handleImageSelect} />
                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 text-center text-sm">
                            {error}
                        </div>
                    )}
                </div>
            )}

            {view === ViewState.ANALYZING && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
                    {imagePreview && (
                        <div className="w-64 h-64 mb-8 relative">
                            <img src={imagePreview} alt="Analyzing" className="w-full h-full object-cover opacity-50 grayscale" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
                            </div>
                        </div>
                    )}
                    <h2 className="text-2xl font-serif italic mb-2">
                        {['Scanning Fabric Texture...', 'Identifying Micro-Trends...', 'Generating Viral Captions...', 'Calculating Aura Score...'][loadingPhase]}
                    </h2>
                    <p className="text-stone-500 text-sm">This usually takes about 5-10 seconds.</p>
                </div>
            )}

            {view === ViewState.RESULTS && result && imagePreview && (
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <img src={imagePreview} alt="Analyzed" className="w-full aspect-[4/5] object-cover" />
                            <div className="mt-6 flex justify-between items-center">
                                <Button variant="outline" onClick={() => setView(ViewState.UPLOAD)}>Analyze Another</Button>
                                <Button onClick={handleSaveToProfile}>Save to Log</Button>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold tracking-widest uppercase text-stone-400">Vibe Rating</span>
                                    <span className="text-xl font-serif italic">{result.vibeRating}/10</span>
                                </div>
                                <div className="w-full bg-stone-100 h-1">
                                    <div className="bg-stone-900 h-1 transition-all duration-1000" style={{ width: `${result.vibeRating * 10}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-bold tracking-widest uppercase text-stone-400 block mb-3">The Critique</span>
                                <p className="text-sm leading-relaxed">{result.critique}</p>
                            </div>

                            <div>
                                <span className="text-xs font-bold tracking-widest uppercase text-stone-400 block mb-3">Palette</span>
                                <div className="flex gap-2">
                                    {result.colors.map((c, i) => (
                                        <div key={i} className="group relative">
                                            <div className="w-8 h-8 rounded-full border border-stone-100 shadow-sm" style={{ backgroundColor: c.hex }}></div>
                                            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                                                {c.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-bold tracking-widest uppercase text-stone-400 block mb-3">Style Keywords</span>
                                <div className="flex flex-wrap gap-2">
                                    {result.styleKeywords.map((k, i) => (
                                        <span key={i} className="px-3 py-1 bg-stone-100 text-xs font-medium text-stone-600">{k}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-stone-50 p-6 border border-stone-200">
                                <span className="text-xs font-bold tracking-widest uppercase text-stone-400 block mb-4">Generated Captions</span>
                                <div className="space-y-4">
                                    {Object.entries(result.captions).map(([style, text]) => (
                                        <div key={style} className="group cursor-pointer" onClick={() => copyToClipboard(text as string)}>
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-[10px] uppercase text-stone-400">{style}</span>
                                                <span className="text-[10px] text-stone-300 group-hover:text-stone-900 transition-colors">Copy</span>
                                            </div>
                                            <p className="font-serif italic text-lg leading-snug group-hover:text-stone-600 transition-colors">"{text}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-bold tracking-widest uppercase text-stone-400 block mb-3">Optimized Hashtags</span>
                                <p className="text-xs text-stone-500 leading-relaxed cursor-pointer hover:text-stone-900" onClick={() => copyToClipboard(result.hashtags.join(' '))}>
                                    {result.hashtags.map(t => `#${t}`).join(' ')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === ViewState.PROFILE && (
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl font-serif italic">Style Log</h2>
                            <p className="text-stone-500 mt-2">Your archive of analyzed fits.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold font-display">{savedOutfits.length}</div>
                            <div className="text-xs uppercase tracking-widest text-stone-400">Looks Logged</div>
                        </div>
                    </div>

                    {savedOutfits.length === 0 ? (
                        <div className="text-center py-24 border border-dashed border-stone-300 bg-stone-50">
                            <p className="text-stone-500 mb-4">No fits logged yet.</p>
                            <Button onClick={() => setView(ViewState.UPLOAD)}>Analyze First Look</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {savedOutfits.map((outfit) => (
                                <div key={outfit.id} className="group relative cursor-pointer" onClick={() => handleViewSavedOutfit(outfit)}>
                                    <div className="aspect-[4/5] bg-stone-100 relative overflow-hidden">
                                        <img src={outfit.image} alt="Saved Fit" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        <button 
                                            onClick={(e) => handleDeleteSavedOutfit(outfit.id, e)}
                                            className="absolute top-2 right-2 bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 text-stone-900 hover:text-red-600"
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-stone-900">{new Date(outfit.timestamp).toLocaleDateString()}</span>
                                            <span className="text-xs text-stone-500">{outfit.analysis.vibeRating}/10</span>
                                        </div>
                                        <p className="text-xs text-stone-500 truncate mt-1 font-serif italic">"{outfit.analysis.captions.minimalist}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </main>
    </div>
  );
};

export default App;