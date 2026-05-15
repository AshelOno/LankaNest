import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, SearchX } from "lucide-react";
import { PageShell, EmptyState } from "@/components/ui/page-shell";

const NotFound = () => {
  useEffect(() => {
    document.title = "LankaNest | Page Not Found";
  }, []);

  return (
    <PageShell contentClassName="flex min-h-[calc(100vh-6rem)] items-center justify-center">
      <EmptyState
        icon={SearchX}
        title="Page not found"
        description="The page you are looking for may have moved, expired, or never existed."
        className="max-w-xl border-solid px-8 py-12"
        action={
          <Link to="/" className="ln-primary-btn">
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        }
      />
    </PageShell>
  );
};

export default NotFound;
