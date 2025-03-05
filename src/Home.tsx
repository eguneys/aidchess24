import './Home.scss'
import { A, useNavigate } from '@solidjs/router'


const Home = () => {

    const navigate = useNavigate()

    return (<>
    <main class='home'>
        <section>
      <h1><A href='repertoires'>Master Chess Through Memorization and Practice.</A></h1>
      <div class='features'>
        <div onClick={() => navigate('/builder')} class='feature'>
            <h2>Build Your Repertoire</h2>
            <ul>
                <li><p>Play against the engine selecting top 5 moves</p></li>
                <li><p>Game is over when evaluation drops -2.</p></li>
                <li><p>Rematch often, and focus on your openings.</p></li>
                <li><small>See the evaluation and accuracy of the moves instantly.</small></li>
                <li><p>Save your lines for further study.</p></li>
            </ul>
        </div>
        <div  onClick={() => navigate('/openings')}class='feature'>
            <h2>Featured Openings</h2>
            <ul>
                <li><span>Slav Defense</span></li>
                <li><span>Sicilian Defense</span></li>
                <li><span>French Defense</span></li>
                <li><small>(or Import a Lichess Study or PGN)</small></li>
            </ul>
        </div>
        <div onClick={() => navigate('repetition')} class='feature'>
            <h2>Spaced Repetition Practice</h2>
            <ul>
                <li><p>Repeat your lines daily with quizzes using spaced repetition.</p></li>
            </ul>
        </div>
        {
            /*
        <div class='feature'>
            <h3>Master Games and Events</h3>
            <ul>
                <li><h4>Bobby Fischer's 60 Memorable Games</h4></li>
                <li><h4>Magnus Carlsen</h4></li>
                <li><h4>Tata Steel 2023</h4></li>
            </ul>
        </div>
        */
}
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
</section>

<section>
      <h1>See your progress, and do challenges</h1>
      <img src='logo-big.webp' alt="See your Progress" style={"max-width:300px; width: 100%;"}></img>
      <br/>
      <p>Discover more features under development.</p>
      <p>With more to come in the future.</p>
</section>
<section>
      <h1>Free educational chess tools for everyone, no ads, no paywalls.</h1>

      <p>Welcome to our community. It's open source too. For the ❤️ of chess.</p>
</section>
      <footer>
        <ul>
            <li><A href="/contact">Contact</A></li>
            <li><A href="/terms">Terms of Service</A></li>
            <li><A href="/privacy">Privacy Policy</A></li>
            <li><A href="/about">About</A></li>
        </ul>

        <ul class='small'>
            <li><A href="https://github.com/eguneys/aidchess24">Github</A></li>
            <li><A href="https://www.twitch.tv/gsoutz">Twitch</A></li>
        </ul>
      </footer>
    </main>
    </>)
}


export default Home