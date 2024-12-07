// Layout.jsx
import Navbar from './components/element/Navbar';

const Layout = ({ children }) => {
  return (
    <div>
      <Navbar />
      
      <main className="mt-[120px] " >{children}</main>
    </div>
  );
};

export default Layout;