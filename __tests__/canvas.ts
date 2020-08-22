import {getCourses} from '../src/canvas';


describe("test canvas functionalities", () => {
  it("test get courses", async done => {
    const courses = await getCourses("all");
    console.log(courses);
    done();
  });

})

