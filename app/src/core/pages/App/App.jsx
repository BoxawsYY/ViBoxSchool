import { useEffect, useState } from "react";
import Loader from "../../components/Loader/Loader";

const App = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const waitForEverything = async () => {
      if (document.readyState !== "complete") {
        await new Promise(resolve =>
          window.addEventListener("load", resolve, { once: true })
        );
      }

      setLoading(false);
    };

    waitForEverything();
  }, []);

  return (
    <>
      <Loader loading={loading} />
      {children}
    </>
  );
};

export default App;
