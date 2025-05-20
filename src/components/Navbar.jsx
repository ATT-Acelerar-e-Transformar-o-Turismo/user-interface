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
                        <details className="dropdown dropdown-end">
                            <summary>My Profile</summary>
                            <ul tabIndex="0" className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                                <li><Link to={'/favorites'} className="text-base-content">Favoritos</Link></li>
                                <li><Link className="text-base-content">Settings</Link></li>
                                <li><a className="text-base-content">Sign out</a></li>
                            </ul>
                        </details>
                    </li>
                    <li>
                        <details className="dropdown dropdown-end">
                            <summary>Admin</summary>
                            <ul className="bg-base-100 rounded-t-none p-2 absolute right-0 mt-2 w-40 z-10">
                                <li>
                                    <Link to={'/indicators-management'} className="text-base-content">Indicators</Link>
                                </li>
                            </ul>
                        </details>
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