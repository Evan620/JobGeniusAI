import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center">
            <span className="font-heading font-bold text-lg text-[#2D3E50]">
              Job<span className="text-[#FFD700]">Genius</span> AI
            </span>
            <span className="ml-2 text-xs text-gray-500">© {new Date().getFullYear()}</span>
          </div>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-4">
              <li>
                <Link href="/privacy">
                  <a className="text-sm text-gray-500 hover:text-[#2D3E50]">Privacy</a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="text-sm text-gray-500 hover:text-[#2D3E50]">Terms</a>
                </Link>
              </li>
              <li>
                <Link href="/support">
                  <a className="text-sm text-gray-500 hover:text-[#2D3E50]">Support</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
