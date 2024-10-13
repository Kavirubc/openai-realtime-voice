'use client'
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Title,
} from 'chart.js';
import ws from '../utils/socket';
import { base64EncodeAudio } from '../utils/audioProcessing';

// Register the components
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title);

async function startMicrophone(setWaveformData) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (event) => {
            const inputData = event.inputBuffer.getChannelData(0);
            setWaveformData(inputData.slice(0, 1000)); // Update waveform data

            const base64AudioData = base64EncodeAudio(inputData);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'input_audio_buffer.append',
                    audio: base64AudioData
                }));
            }
        };

        source.connect(processor).connect(audioContext.destination);
        return { stream, source, processor };
    } catch (err) {
        console.error('Error accessing microphone:', err);
    }
}

export default function AudioCapture() {
    const [waveformData, setWaveformData] = useState(new Float32Array(1000));
    const [sessionActive, setSessionActive] = useState(false);
    let audioSession;

    const startSession = async () => {
        audioSession = await startMicrophone(setWaveformData);
        setSessionActive(true);
    };

    const endSession = () => {
        if (audioSession) {
            audioSession.stream.getTracks().forEach(track => track.stop());
            audioSession.processor.disconnect();
            audioSession.source.disconnect();
            setSessionActive(false);
        }
    };

    return (
        <div>
            <h1>Realtime Voice Interaction</h1>
            <button onClick={startSession} disabled={sessionActive}>Start Session</button>
            <button onClick={endSession} disabled={!sessionActive}>End Session</button>

            <Line
                data={{
                    labels: Array.from({ length: waveformData.length }, (_, i) => i),
                    datasets: [{
                        label: 'Microphone Input',
                        data: Array.from(waveformData),
                        borderColor: 'blue',
                        borderWidth: 1,
                        pointRadius: 0,
                    }]
                }}
                options={{
                    scales: {
                        x: { display: false },
                        y: { min: -1, max: 1 }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }}
            />
        </div>
    );
}
