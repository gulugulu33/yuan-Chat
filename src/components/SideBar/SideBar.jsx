import React, { useContext, useState } from 'react'
import './SideBar.css'
import { assets } from '../../assets/assets'
import { Context } from '../../context/Context';

const SideBar = () => {
    const [extended, setExtended] = useState(true);
    const { sessions, currentSessionId, createNewSession, loadSession, deleteSession } = useContext(Context);

    return (
        <div className='sidebar'>
            <div className="top">
                <img className='menu' src={assets.menu_icon} alt="" onClick={() => setExtended(!extended)} />
                <div onClick={() => createNewSession()} className="new-chat">
                    <img src={assets.plus_icon} alt="" />
                    {extended ? <p>New Chat</p> : null}
                </div>
                {extended &&
                    <div className="recent">
                        <p className='recent-title'>Recent</p>
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => loadSession(session.id)}
                                className={`recent-entry ${session.id === currentSessionId ? 'active' : ''}`}
                            >
                                <img src={assets.message_icon} alt="" />
                                <p>{session.title.slice(0, 18)}...</p>
                                <img 
                                    src={assets.trash} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSession(session.id);
                                    }} 
                                    alt="" 
                                    className="delete-icon"
                                />
                            </div>
                        ))}
                    </div>
                }
            </div>
            <div className="bottom">
                <div className="bottom-item recent-entry">
                    <img src={assets.question_icon} alt="" />
                    {extended ? <p>Help</p> : null}
                </div>
                <div className="bottom-item recent-entry">
                    <img src={assets.history_icon} alt="" />
                    {extended ? <p>Activity</p> : null}
                </div>
                <div className="bottom-item recent-entry">
                    <img src={assets.setting_icon} alt="" />
                    {extended ? <p>Setting</p> : null}
                </div>
            </div>
        </div>
    )
}

export default SideBar;
