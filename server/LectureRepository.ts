const fs = require('fs');
const path = require('path');
const publicDir = __dirname + '/../public/';
const rootDir = publicDir + 'lectures/';
const slideFilenameRegex = /^([1-9]\d*)\.svg$/
import Lecture from './Lecture';
import { ILectureData } from '../model/Lecture.interface';

export default class LectureRepository {
    private static instance = new LectureRepository();

    public static get() {
        return LectureRepository.instance;
    }

    private lectures: { [key: string]: Lecture } = {};
    private lectureData: { [key: string]: ILectureData } = {};
    private lectureIds: string[] = [];
    private activeLectureId: string = undefined;

    constructor() {
    }

    public init() {
        console.log('Read all lectures. Please wait...');

        this.lectureData = readAllLectures();
        this.lectureIds = Object.keys(this.lectureData);

        this.lectureIds.map(id => this.getLecture(id));

        console.log(`I found ${this.lectureIds.length} lecture(s).`);
    }

    public exists(id: string) {
        return this.lectureIds.indexOf(id) > -1;
    }

    public getLecture(id: string) {
        id = id || this.lectureIds[0];

        if (!this.lectureData[id]) {
            return;
        }

        if (!this.lectures[id]) {
            this.lectures[id] = new Lecture(this.lectureData[id]);
        }

        return this.lectures[id];
    }

    public setActiveLecture(id: string) {
        this.activeLectureId = id;
    }

    public getActiveLecture() {
        if (this.activeLectureId) {
            return this.getLecture(this.activeLectureId);
        }
    }

    public getLectureData() {
        return this.lectureData;
    }

    public getNumberOfLectures() {
        return this.lectureIds.length;
    }
}

function readAllLectures(): { [key: string]: ILectureData } {
    let items = fs.readdirSync(rootDir);
    let lectures = {};

    for (let item of items) {
        if (fs.statSync(rootDir + '/' + item).isDirectory()) {
            let lecture = readLecture(item);

            if (lecture) {
                lectures[item] = lecture;
            }
        }
    }

    return lectures;
}

function readLecture(id): ILectureData {
    let dir = rootDir + '/' + id;
    let slides = fs.readdirSync(dir);
    let lecture = {
        path: path.relative(publicDir, dir),
        length: 0,
        min: 99999,
        max: 0,
        name: id.replace('-', ' '),
        id
    };

    for (let slide of slides) {
        let match = slide.match(slideFilenameRegex);

        if (!fs.statSync(dir + '/' + slide).isFile() || !match) {
            console.log(`Skip ${slide}.`);

            continue;
        }

        let slideIndex = parseInt(match[1], 10);

        if (lecture.min > slideIndex) {
            lecture.min = slideIndex;
        }

        if (lecture.max < slideIndex) {
            lecture.max = slideIndex
        }

        lecture.length++;
    }

    if (lecture.length === 0) {
        console.log(`INFO: Skip "${id}", because it doesn't contain any slides.`);

        return;
    }

    if ((lecture.max - lecture.min + 1) !== lecture.length) {
        console.log(`WARNING: In lecture "${id}" are probably one or more slides missing!`);
    }

    return lecture;
}
