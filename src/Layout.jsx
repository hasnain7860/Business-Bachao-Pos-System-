// Layout.jsx
import Navbar from './components/element/Navbar';


const Layout = ({ children }) => {
  // const checkInternetConnection = () => {
  //   return new Promise((resolve) => {
  //     fetch('https://www.google.com', {
  //       mode: 'no-cors', // Avoid CORS issues
  //       cache: 'no-store', // Ensure fresh request
  //       timeout: 5000, // Set timeout to 5 seconds
  //     })
  //       .then(() => {
  //         console.log('Internet connection available.');
  //         resolve(true);
  //       })
  //       .catch(() => {
  //         console.log('Internet connection not available.');
  //         resolve(false);
  //       });
  //   });
  // };
  
  // // Example usage
  // checkInternetConnection().then((isConnected) => {
  //   if (isConnected) {
      
  //     deleteItemsFromFirebase();
  //   }
  // });
  
  // // Set interval to check connection periodically
  // setInterval(() => {
  //     checkInternetConnection().then((isConnected)=>{
  //         if(isConnected){
  //             deleteItemsFromFirebase();
  //         }
  //     })
  // }, 10000); // Check every 10 seconds
  return (
    <div>
      <Navbar />
      
      <main className="mt-12">{children}</main>
    </div>
  );
};

export default Layout;