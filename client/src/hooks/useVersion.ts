import { useState, useEffect } from "react";

interface VersionInfo {
  version: string;
  buildDate?: string;
  environment: string;
}

export const useVersion = (): VersionInfo => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    version: "0.2.0",
    environment: "development",
  });

  useEffect(() => {
    // In produzione, la versione dovrebbe essere iniettata dal build process
    // Per ora usiamo la versione dal package.json
    const getVersion = async () => {
      try {
        // In un'app reale, questo potrebbe essere un endpoint API
        // o una variabile d'ambiente iniettata dal build
        const packageVersion = process.env.REACT_APP_VERSION || "0.2.0";
        const buildDate = process.env.REACT_APP_BUILD_DATE;
        const environment = process.env.NODE_ENV || "development";

        setVersionInfo({
          version: packageVersion,
          buildDate,
          environment,
        });
      } catch (error) {
        console.warn("Errore nel caricamento della versione:", error);
        // Fallback alla versione di default
        setVersionInfo({
          version: "0.2.0",
          environment: "development",
        });
      }
    };

    getVersion();
  }, []);

  return versionInfo;
};
