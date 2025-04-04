import Navbar from "@/components/user/common/Navbar";

export default function UserLayout({ children }) {
  return (
    <div className="">
      <Navbar />
      {children}
    </div>
  );
}
