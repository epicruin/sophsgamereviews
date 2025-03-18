import { BrowserRouter as Router, Routes, Route, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, Lock } from "lucide-react";
import Index from "@/pages/Index";
import SingleReview from "@/pages/singleReview";
import Articles from "@/pages/Articles";
import SingleArticle from "@/pages/singleArticle";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import EditReview from "@/pages/admin/EditReview";
import CreateReview from "@/pages/admin/CreateReview";
import CreateArticle from "@/pages/admin/CreateArticle";
import EditArticle from "@/pages/admin/EditArticle";
import Genre from "@/pages/Genre";
import Author from "@/pages/Author";
import { GameStateProvider } from "@/components/game/GameState";
import { GameWheelDialog } from "@/components/GameWheelDialog";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";
import "./App.css";
import FeaturedReviews from "@/pages/sections/featured";
import LatestReviews from "@/pages/sections/latest";
import GenreOfMonth from "@/pages/sections/genre-of-month";
import HiddenGems from "@/pages/sections/hidden-gems";
import CozyCorner from "@/pages/sections/cozy-corner";
import CustomSection from "@/pages/sections/custom-section";
import BrowseGenres from "@/pages/sections/browse-genres";
import { ReviewCarouselButton } from "@/components/home/ReviewCarouselButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Create a container component to use router hooks
function AppContainer() {
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Handler for section changes - doesn't navigate, just logs
  const handleSectionChange = (sectionId: string) => {
    console.log(`Section changed to: ${sectionId}`);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsButtonVisible(false);
      
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      const timeout = setTimeout(() => {
        setIsButtonVisible(true);
      }, 1000);
      
      setScrollTimeout(timeout);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollTimeout]);

  // Only show the ReviewCarouselButton if we're not on the homepage
  const isHomepage = location.pathname === "/";
  
  // Hide all buttons on admin pages
  const isAdminPage = location.pathname.startsWith("/admin");
  
  return (
    <>
      {!isAdminPage && <GameWheelDialog />}
      
      {/* Review Carousel Button - only on non-homepage, non-admin pages */}
      {!isHomepage && !isAdminPage && (
        <ReviewCarouselButton 
          position="responsive"
          onSectionChange={handleSectionChange}
          className="print:hidden"
        />
      )}

      {/* Navigation buttons */}
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 print:hidden transition-all duration-300 flex items-center gap-2 ${
        isButtonVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Home button - only on non-homepage, non-admin pages */}
        {!isHomepage && !isAdminPage && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="sm" className="bg-gradient-to-br from-rose-400/80 via-pink-400/80 to-rose-400/80 hover:from-rose-600/90 hover:via-rose-500/90 hover:to-pink-600/90 text-white hover:text-white border border-rose-300/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                  <Link to="/">
                    <Home className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="bg-slate-900/95 backdrop-blur-sm border-slate-800 text-white text-sm px-3 py-1.5"
              >
                Back to Homepage
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Admin Dashboard button - show on all pages (including homepage) except admin pages */}
        {!isAdminPage && isAdmin && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="sm" className="bg-gradient-to-br from-rose-400/80 via-pink-400/80 to-rose-400/80 hover:from-rose-600/90 hover:via-rose-500/90 hover:to-pink-600/90 text-white hover:text-white border border-rose-300/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                  <Link to="/admin/dashboard">
                    <Lock className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="bg-slate-900/95 backdrop-blur-sm border-slate-800 text-white text-sm px-3 py-1.5"
              >
                Admin Dashboard
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/reviews/:id" element={<SingleReview />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:id" element={<SingleArticle />} />
        <Route path="/genre/:genreName" element={<Genre />} />
        <Route path="/author/:username" element={<Author />} />
        <Route path="/sections/featured" element={<FeaturedReviews />} />
        <Route path="/sections/latest" element={<LatestReviews />} />
        <Route path="/sections/genre-of-month" element={<GenreOfMonth />} />
        <Route path="/sections/hidden-gems" element={<HiddenGems />} />
        <Route path="/sections/cozy-corner" element={<CozyCorner />} />
        <Route path="/sections/custom-section" element={<CustomSection />} />
        <Route path="/sections/browse-genres" element={<BrowseGenres />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/reviews/create" element={<CreateReview />} />
        <Route path="/admin/reviews/:id/edit" element={<EditReview />} />
        <Route path="/admin/articles/create" element={<CreateArticle />} />
        <Route path="/admin/articles/:id/edit" element={<EditArticle />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <GameStateProvider>
      <Router>
        <AppContainer />
      </Router>
    </GameStateProvider>
  );
}

export default App;
