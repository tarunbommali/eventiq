import {Outlet} from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export const AppLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f1a]">
        <Header/>
        <main className='flex-1'><Outlet /></main>
        <Footer/>
    </div>
  )
}

export default AppLayout