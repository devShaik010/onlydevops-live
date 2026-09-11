import { BookOpen, FlaskConical } from "lucide-react";

export default function WorkspaceNav({ practice = false }) {
  return (
    <nav className="workspace-nav" aria-label="Workspace">
      <a href="/" aria-current={!practice ? "page" : undefined}>
        <BookOpen size={16} aria-hidden="true" /> Learning sheet
      </a>
      <a href="/practice" aria-current={practice ? "page" : undefined}>
        <FlaskConical size={16} aria-hidden="true" /> Practice
      </a>
    </nav>
  );
}
