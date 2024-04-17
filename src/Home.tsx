import './Home.scss'
import { A } from '@solidjs/router'


const Home = () => {
    return (<>
    <div class='home'>
      <h1><A href='repertoires'>Master Chess Through Memorization and Practice.</A></h1>
      <div class='features'>
        <div class='feature'>
            <h3>Featured Openings</h3>
            <ul>
                <li><h4>Slav Defense</h4></li>
                <li><h4>Sicilian Defense</h4></li>
                <li><h4>French Defense</h4></li>
            </ul>
        </div>
        <div class='feature'>
            <h3>Master Games and Events</h3>
            <ul>
                <li><h4>Bobby Fischer's 60 Memorable Games</h4></li>
                <li><h4>Magnus Carlsen</h4></li>
                <li><h4>Tata Steel 2023</h4></li>
            </ul>
        </div>
        {/*
        <div class='feature'>
            <h3>Tactics and Endgame</h3>
            <ul>
                <li><h4>Puzzle Sets</h4></li>
                <li><h4>Endgame Studies</h4></li>
            </ul>
        </div>
    */}
      </div>


      <h1>See your progress, and do challenges</h1>
      <img src='vite.svg' alt="See your Progress" height="180px"></img>


      <footer>
        <ul>
            <li><A href="/contact">Contact</A></li>
            <li><A href="/terms">Terms of Service</A></li>
            <li><A href="/privacy">Privacy Policy</A></li>
            <li><A href="/about">About</A></li>
        </ul>
      </footer>
    </div>
    </>)
}


export default Home