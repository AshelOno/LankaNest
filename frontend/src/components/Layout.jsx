import PropTypes from "prop-types";
import Header from "./include/Header";
import Footer from "./include/Footer";
import { useLocation } from "react-router-dom";
import ChatBubble from "@/components/chat/ChatBubble";

const Layout = ({ children }) => {
  const location = useLocation();
  const isSearchMap = location.pathname === "/search";
  const isHome = location.pathname === "/";

  return (
    <div className="ln-page-surface min-h-screen text-slate-950">
      <Header />
      <main className={`isolate ${!isHome ? "pt-[72px]" : ""}`}>{children}</main>
      <ChatBubble />
      {!isSearchMap && <Footer />}
    </div>
  );
};
Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
