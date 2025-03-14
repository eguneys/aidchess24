import { createSignal, onCleanup, onMount } from 'solid-js';
import './TimeAgo.scss'

function TimeAgo(props: { timestamp: number }) {
  const [timeAgo, setTimeAgo] = createSignal('');

  const updateTimeAgo = () => {
    const now = new Date().getTime();
    const seconds = Math.round((now - props.timestamp) / 1000);

    if (seconds < 60) {
      setTimeAgo(`${seconds} seconds ago`);
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      setTimeAgo(`${minutes} minutes ago`);
    } else if (seconds < 86400) {
      const hours = Math.round(seconds / 3600);
      setTimeAgo(`${hours} hours ago`);
    } else if (seconds < 604800) {
      const days = Math.round(seconds / 86400);
      setTimeAgo(`${days} days ago`);
    } else if (seconds < 2592000) {
      const weeks = Math.round(seconds / 604800);
      setTimeAgo(`${weeks} weeks ago`);
    } else if (seconds < 31536000) {
      const months = Math.round(seconds / 2592000);
      setTimeAgo(`${months} months ago`);
    } else {
      const years = Math.round(seconds / 31536000);
      setTimeAgo(`${years} years ago`);
    }
  };

  onMount(() => {
      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 60000)
      onCleanup(() => clearInterval(interval))
  });

  return <span class='time-ago'>{timeAgo()}</span>;
}

export default TimeAgo;