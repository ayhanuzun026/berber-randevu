import { Outlet } from 'react-router-dom';
import Seo from '../common/Seo';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="layout">
      <Seo />
      <Header />
      <main className="layout__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
