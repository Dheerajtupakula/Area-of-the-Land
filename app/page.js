"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Webcam from "react-webcam";

const DynamicMap = dynamic(() => import("./components/MapComponent"), {
  ssr: false,
});

export default function Home() {
  const [data, setData] = useState([]);
  const [images, setImages] = useState({
    east: null,
    west: null,
    north: null,
    south: null,
  });
  const [isMapView, setIsMapView] = useState(false);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentDirection, setCurrentDirection] = useState(null);
  const webcamRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);

  const directions = [
    "east",
    "west",
    "north",
    "south",
    "south-east",
    "south-west",
    "north-east",
    "north-west",
  ];
  useEffect(() => {
    setData(data);
  }, [data]);

  const handleDevices = useCallback(
    (mediaDevices) => {
      const videoDevices = mediaDevices.filter(
        ({ kind }) => kind === "videoinput"
      );
      setDevices(videoDevices);

      const backCamera = videoDevices.find((device) =>
        device.label.toLowerCase().includes("back")
      );
      const frontCamera = videoDevices.find((device) =>
        device.label.toLowerCase().includes("front")
      );

      const preferredCamera = backCamera || frontCamera || videoDevices[0];
      setDeviceId(preferredCamera?.deviceId || null);

      setSelectedCamera(preferredCamera?.deviceId || null);

      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      );
    },
    [setDevices]
  );

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  const switchCamera = () => {
    const currentIndex = devices.findIndex(
      (device) => device.deviceId === selectedCamera
    );
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedCamera(devices[nextIndex].deviceId);
  };

  const capture = useCallback(() => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    if (!webcamRef.current) {
      console.error("Webcam reference not available");
      setIsLoading(false);
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      console.error("Failed to capture image");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setData((prevData) => [
          ...prevData,
          { name: currentDirection, lat: latitude, lon: longitude },
        ]);

        setImages((prevImages) => ({
          ...prevImages,
          [currentDirection]: {
            image: imageSrc,
            lat: latitude,
            lon: longitude,
          },
        }));

        setIsCameraOpen(false);
        setCurrentDirection(null);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error getting location", error);

        setImages((prevImages) => ({
          ...prevImages,
          [currentDirection]: {
            image: imageSrc,
            lat: null,
            lon: null,
          },
        }));

        setIsCameraOpen(false);
        setCurrentDirection(null);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
      }
    );
  }, [currentDirection, webcamRef, isLoading]);

  const handleDirectionClick = (direction) => {
    setCurrentDirection(direction);
    setIsCameraOpen(true);
  };

  const handleMap = () => {
    setIsMapView(!isMapView);
  };

  return (
    <main className="relative flex flex-col justify-center items-center gap-3 ">
      {!isMapView && (
        <div className="p-2">
          {isCameraOpen && (
            <div
              className={`absolute inset-0 ${
                isMobile ? "h-screen" : "h-full"
              } flex justify-center items-center bg-black bg-opacity-50 z-50`}
            >
              <div className="flex  flex-col justify-center items-center bg-white p-4 rounded shadow-lg">
                {devices.length > 0 && (
                  <Webcam
                    audio={false}
                    height={isMobile ? 480 : 360}
                    width={isMobile ? 320 : 480}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ deviceId: selectedCamera || undefined }}
                  />
                )}
                <button
                  className="mt-4 p-2 bg-blue-500 text-white rounded"
                  onClick={capture}
                  disabled={isLoading}
                >
                  {isLoading ? "Capturing..." : `Capture ${currentDirection}`}
                </button>

                <button
                  className="mt-2 p-2 bg-gray-300 text-gray-800 rounded"
                  onClick={switchCamera}
                >
                  Switch Camera
                </button>

                {isLoading && (
                  <div className="absolute text-white inset-0 z-50 bg-slate-700/75 flex justify-center items-center">
                    {" "}
                    Capturing...
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {directions.map((direction) => (
              <div
                key={direction}
                className="border p-4 flex justify-center items-center"
              >
                {images[direction] ? (
                  <div className="size-20">
                    <img
                      className="w-full h-full object-cover"
                      src={images[direction].image}
                      alt={direction}
                    />
                  </div>
                ) : (
                  <button
                    className="p-4 bg-blue-500 text-white rounded"
                    onClick={() => handleDirectionClick(direction)}
                  >
                    {direction.charAt(0).toUpperCase() + direction.slice(1)}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.length > 2 && (
        <button
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium tracking-wide text-white transition-colors duration-200 rounded-md bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 focus:shadow-outline focus:outline-none"
          onClick={handleMap}
        >
          View Map
        </button>
      )}
      {data.length > 2 && isMapView && <DynamicMap data={data} />}
      {/* <DynamicMap data={data} /> */}
    </main>
  );
}
