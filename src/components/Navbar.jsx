import { Link } from "react-router-dom"

export default function Navbar() {
    return (
        <div className="navbar bg-base-300 px-4 flex justify-between">
            <div className="">
                <Link to={'/home'} className="flex-1">
                    <div className="btn btn-ghost text-xl text-base-content">ATT</div>
                </Link>
            </div>
            <div className="flex-none">
                <ul className="menu menu-horizontal px-1">
                    <li>
                        <a className="text-base-content">Sign in</a>
                    </li>
                    <li>
                        <details>
                            <summary>PT</summary>
                            <ul className="bg-base-100 rounded-t-none p-2 absolute right-0 mt-2 w-40 z-10">
                                <li><a>Português</a></li>
                                <li><a>English</a></li>
                            </ul>
                        </details>
                    </li>
                </ul>
            </div>
        </div>
    )
}