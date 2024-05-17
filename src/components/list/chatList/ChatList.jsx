import { useEffect, useState } from 'react'
import './chatList.css'
import AddUser from './addUser/AddUser';
import { useUserStore } from '../../../lib/userStore';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useChatStore } from '../../../lib/chatStore';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState('');
  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
      // setChats(doc.data());
      const items = res.data().chats;
      // console.log("Data recieved when listening to snapShot 1", res.data());

      const promisses = items.map(async (item) => {
        const userDocRef = doc(db, "users", item.receiverId);
        const UserDocSnap = await getDoc(userDocRef);

        const user = UserDocSnap.data();

        return { ...item, user }
      });

      const chatData = await Promise.all(promisses);
      setChats(chatData.sort((a, b) => b.updateAt - a.updateAt));
      // console.log("Chats", chats.messages)
    });
    return () => {
      unSub();
    }
  }, [currentUser.id]);

  const handleSelect = async (chat) => {

    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);
    userChats[chatIndex].isSeen = true;
    console.log("On Select", userChats[chatIndex].isSeen)
    const userChatsRef = doc(db, "userchats", currentUser.id);
    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      // setChats(userChats);
      changeChat(chat.chatId, chat.user)
    }
    catch (error) {
      console.log(error);
    }
  }

  const filteredChats = chats.filter( (c) => 
    c.user.username.toLowerCase().includes(input.toLowerCase()) )
  return (
    <div className='chatList'>
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input type="text" placeholder='Search' onChange={(e) => setInput(e.target.value)}/>
        </div>
        <img src={addMode ? './minus.png' : './plus.png'} alt="" className='add' onClick={() => {
          setAddMode((prev) => !prev)
        }} />
      </div>
      {filteredChats.map((chat) => (
        <div className="items" key={chat.chatId} onClick={() => handleSelect(chat)} style={{ backgroundColor: chat?.isSeen ? "transparent" : "#5183fe" }}>
          <img src={chat.user.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{chat.user.username}</span>
            <p>{chat.lastMessage}</p>
          </div>
        </div>)
      )}

      {addMode && <AddUser />}

    </div>
  )
}

export default ChatList;