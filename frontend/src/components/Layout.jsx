import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-pastelBlue">
      <Navbar />
      <main className="w-full">{children}</main>
    </div>
  );
};

export default Layout;
