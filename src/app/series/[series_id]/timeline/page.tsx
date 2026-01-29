'use client';

import { useEffect, useState } from "react";
import { useSeriesData } from "../SeriesDataContext"
import { getSeriesFile, getSeriesFileList } from "@/lib/grid/files";
import { File } from "@/types/file";
import { flattenEvents, getEventActor } from "@/lib/grid/seriesAnalysis";

export default function Timeline() {
    const { series } = useSeriesData();
    const [loading, setLoading] = useState(true)
    const [fileList, setFileList] = useState<any>(null);

    useEffect(() => {
        if (!series) return;

        setLoading(true);
        getSeriesFileList(series.id).then((fileList) => {
            setFileList(fileList);

            const events = fileList.files.find(file => file.id === 'events-grid')
            if (events) {
                getSeriesFile(series.id, 'events').then((data) => {
                    console.log(data.length)
                    const eventSteam = flattenEvents(data);
                    const filterStream = eventSteam.filter(e => getEventActor(e)?.id === "22953");
                    console.log('Flattened event stream:', filterStream);
                }).catch((error) => {
                    console.error('Error fetching events file data:', error);
                }).finally(() => {
                    setLoading(false);
                });
            }
        }).finally(() => {
            setLoading(false);
        });
    }, [series])

    return (
        <div>
            {loading && <p>Loading timeline data...</p>}
            {!loading &&
                <div>
                    {fileList && fileList.files.map((file: File) => (
                        <div key={file.fileName} className="mb-4 p-4 border border-zinc-200 dark:border-zinc-700 rounded">
                            <h2 className="text-lg font-medium mb-2">{file.fileName}</h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{file.description}</p>
                            <a
                                href={file.fullURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Download
                            </a>
                        </div>
                    ))}
                </div>
            }
        </div>
    )
}