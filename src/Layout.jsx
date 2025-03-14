// Layout.jsx
import Navbar from './components/element/Navbar';


const Layout = ({ children }) => {

  return (
    <div>
      <Navbar />
      
      <main className="mt-12">{children}</main>
    </div>
  );
};

export default Layout;