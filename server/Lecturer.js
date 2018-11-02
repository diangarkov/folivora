const Student = require('./Student');
const LectureRepository = require('./LectureRepository');

class Lecturer extends Student {
    constructor(id, socket, io) {
        super(id, socket, io);

        socket.join('lecturer');

        socket.on('get', (param, response) => {
            if (param === 'lectures') {
                response(this.lectureRepository.getLectureData());
            }
        });

        socket.on('config', (config) => {
            if (config.activeLecture && this.lectureRepository.exists(config.activeLecture)) {
                console.log(`Set active lecture: ${config.activeLecture}`);
                //@TODO test
                this.lectureRepository.setActiveLecture(config.activeLecture);

                io.emit('page', this.lectureRepository.getLecture(config.activeLecture).getCurrentPage());
            }
        });

        socket.on('move', (direction) => {
            let lecture = this.lectureRepository.getActiveLecture();

            if (!lecture) {
                return;
            }

            lecture.move(direction);

            io.emit('page', lecture.getCurrentPage());
        });

        socket.on('poll', ({
            question,
            choices
        }) => {
            let lecture = this.lectureRepository.getActiveLecture();

            if (!lecture) {
                return;
            }

            lecture.setPoll(question, choices);

            io.emit('page', lecture.getCurrentPage());
        });
    }
}

module.exports = Lecturer;