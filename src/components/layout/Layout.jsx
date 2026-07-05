import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Seo from '../common/Seo';
import Header from './Header';
import Footer from './Footer';
import LoadingSpinner from '../common/LoadingSpinner';
import './Layout.css';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="layout">
      <Seo />
      <Header />
      <main className="layout__main">
        <Suspense fallback={<LoadingSpinner />}>
          {/* key ile her sayfa değişiminde içerik yeniden monte olup fade-in yapar */}
          <div className="page-transition" key={location.pathname}>
            <Outlet />
          </div>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
