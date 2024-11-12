import './Contact.scss'
import { Match, Switch, createMemo } from "solid-js"
import { useNavigate, useLocation, A } from '@solidjs/router'

const ContactView = () => {


    let location = useLocation()
    const pathname = createMemo(() => location.pathname)

    const navigate = useNavigate()

    return (<>
    <div class='contact'>
      <ul class='tabs'>
        <li onClick={() => navigate('/about', { replace: true })} class={pathname()==='/about'?'active':''}><h4>About</h4></li>
        <li onClick={() => navigate('/terms', { replace: true })} class={pathname()==='/terms'?'active':''}><h4>Terms of Service</h4></li>
        <li onClick={() => navigate('/privacy', { replace: true })} class={pathname()==='/privacy'?'active':''}><h4>Privacy Policy</h4></li>
        <li onClick={() => navigate('/contact', { replace: true })} class={pathname()==='/contact'?'active':''}><h4>Contact</h4></li>
        <li onClick={() => navigate('/donate', { replace: true })} class={pathname()==='/donate'?'twitch active':'twitch'}><h4>Donate</h4></li>
        <li onClick={() => navigate('/thanks', { replace: true })} class={pathname()==='/thanks'?'active':''}><h4>Thanks</h4></li>
      </ul>
      <div class='content'>
        <Switch>
            <Match when={pathname()==='/about'}><About/></Match>
            <Match when={pathname()==='/terms'}><Terms/></Match>
            <Match when={pathname()==='/privacy'}><Privacy/></Match>
            <Match when={pathname()==='/contact'}><Contact/></Match>
            <Match when={pathname()==='/donate'}><Donate/></Match>
            <Match when={pathname()==='/thanks'}><Thanks/></Match>
        </Switch>
      </div>
    </div>
    </>)
}

const Thanks = () => {

    return (<>
    <h1>Thanks</h1>
    <ul>
      <li><p>Lichess.org</p></li>
      <li><p>Quality Chess Books</p></li>
      <li><p>My Family {'<3'}</p></li>
    </ul>
    </>)
}


const Donate = () => {

    return (<>
    <div class='donate'>
      <h1>Free Chess Education Tools for everyone</h1>

      <p class='twitch'><a href="https://twitch.tv/gsoutz" target="_blank">Support me on Twitch</a></p>
      <iframe width="520px" height="270px" src="https://clips.twitch.tv/embed?clip=InexpensiveBigPelicanKappaPride-pB0DDQjPbt_afn2V&parent=aidchess.com"></iframe>
      <p>
          < a target="_blank" href="https://patreon.com/eguneys?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink">Patreon</a>
      </p>

    </div>
    </>)
}

const Terms = () => {

    return (<>
    <h1> Terms of Service </h1>

    <strong>Last updated: 26.02.2024</strong>
    <p>
      By using this website, you agree to the following terms:
    </p>
      <ul>
        <li><p>We are not liable for any data loss or issues arising from the use of this site.</p></li>
        <li><h2>DMCA</h2></li>
        <li><p>If you believe your content has been copied in a way that constitutes copyright infringement, please report this by getting in touch with us as outlined on our <A href="/contact">contact page</A>.</p></li>

      </ul>
    <p> Enjoy your chess learning experience!  </p>
    </>)
}


const Privacy = () => {

    return (<>
      <h1> Privacy Policy </h1>

      <strong>Last updated: 26.02.2024</strong>

      <p>
        This Privacy Policy outlines how we handle your information on aidchess.com. By using our website, you agree to the terms outlined below.
      </p>
      <ul>
        <li><p>We do not collect any personal information from users.</p></li>
        <li><p>Your progress and challenges are stored locally on your device, using local storage.</p></li>
        <li><p>We do not use tracking mechanisms, cookies, or any similar technologies.</p></li>
        <li><p>Our website is ad-free, providing a focused and uninterrupted chess learning experience.</p></li>
        <li><p>Our site may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites.</p></li>
        <li><p>We reserve the right to update our Privacy Policy. Any changes will be posted on this page, and the date of the last modification will be indicated.</p></li>
        <li><p>For any questions or concerns regarding this Privacy Policy, please contact us at iplaythefrench at gmail dot com. </p></li>
      </ul>

      <p>
        By using our website, you acknowledge and agree to the terms of this Privacy Policy.
      </p>

    </>)
}


const Contact = () => {

    return (<>
    <h1> Contact </h1>
    <ul>
      <li><p>Email me at iplaythefrench at gmail dot com.</p></li>
      <li><p>Reach me out at <a href="https://lichess.org/@/heroku">https://lichess.org/@/heroku</a>.</p></li>
      <li><p>Open an issue at <a href="https://github.com/eguneys/aidchess24">https://github.com/eguneys/aidchess24</a></p></li>
    </ul>
    </>)
}



const About = () => {

    return (<>
    <h1> About aidchess.com </h1>
    <p>
      Aidchess.com is a hobby project for providing educational tools for studying chess. Developed by <a href="https://x.com/@eguneys">@eguneys</a>, for free and open source.
    </p>
    </>)
}

export default ContactView