export default function WhiteScreen() {
  return (
    <div className="w-full h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">White Screen</h1>
        <p className="text-gray-600">If you see this, React Router routing is working!</p>
      </div>
    </div>
  );
}
