import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined); // Initialize to undefined

  React.useEffect(() => {
    // Only run on the client
    const checkDevice = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check
    checkDevice();

    const handleResize = () => {
        checkDevice();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty dependency array ensures this runs only once on mount (on the client)

  return isMobile; // Can be undefined during SSR or initial client render before effect runs
}
