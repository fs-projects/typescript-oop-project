//Drag and Drop interfaces
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  /*handler will handle the case to signal the browser that the thing user is dragging over is a valid drag target. 
  This will permit or don't permit the drop.*/

  dragOverHandler(event: DragEvent): void;
  //handler will handle the case of a drop. Like data change on UI.
  dropHandler(event: DragEvent): void;
  //handler will handle the case of visual feedback to user when the drop has been made.
  dragLeaveHandler(event: DragEvent): void;
}

//Project Type
enum ProjectStatus {
  Active,
  Finished
}

//A structure in created using class to store the projects added by the form
class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

//Project State Management - A singleton class
type Listener<T> = (item: T[]) => void;

//Creating a State class for more genericity -
class State<T> {
  protected listeners: Listener<T>[] = [];
  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

class ProjectState extends State<Project> {
  private projects: Project[] = [];
  private static instance: ProjectState; /*this property is made static because a static method 'getInstance' is 
  using it*/
  private constructor() {
    super();
  }
  //Returning a singleton instance
  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    this.updateListeners();
  }

  moveProject(projectId: string, newStatus: ProjectStatus) {
    const project = this.projects.find(prj => prj.id === projectId);
    if(project && project.status !== newStatus){
      project.status = newStatus;
      this.updateListeners();
    }
  }
  
  updateListeners(){
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice()); //slice returns the copy of the array so original array is not modified
    }
  }
}

const projectState = ProjectState.getInstance();

//Form Validation
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}
//Validate user inputs
function validate(validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength;
  }
  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength;
  }
  if (
    validatableInput.min != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }
  if (
    validatableInput.max != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }
  return isValid;
}

function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: false,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    }
  };
  return adjDescriptor;
}

//Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string
  ) {
    /*returns a template html element that has a document fragment inside of it which contains a form. 
    The DocumentFragment interface represents a minimal document object that has no parent. It is used as a
    lightweight version of Document that stores a segment of a document structure comprised of nodes just 
    like a standard document. The key difference is due to the fact that the document fragment isn't part 
    of the active document tree structure. Changes made to the fragment don't affect the document (even on 
    reflow) or incur any performance impact when changes are made.
    Event Target -> Node -> DocumentFragment
    */
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T;
    /*
    The Document object's importNode() method creates a copy of a Node or DocumentFragment from another document,
    to be inserted into the current document later. The imported node is not yet included in the document tree. 
    To include it, you need to call an insertion method such as appendChild() or insertBefore() with a node that 
    is currently in the document tree. Unlike document.adoptNode(), the original node is not removed from its 
    original document. The imported node is a clone of the original.
    */

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    /*
    The firstChild property returns the first child node of the specified node, as a Node object.
    The difference between this property and firstElementChild, is that firstChild returns the first child node as an element node, 
    a text node or a comment node (depending on which one's first), while firstElementChild returns the 
    first child node as an element node (ignores text and comment nodes).
    Note: Whitespace inside elements is considered as text, and text is considered as nodes (See "More Examples").
    This property is read-only.
    Tip: Use the element.childNodes property to return any child node of a specified node. childNodes[0] will produce the same result as firstChild.
    Tip: To return the last child node of a specified node, use the lastChild property.
    */
    this.element = importedNode.firstElementChild as U;
    if (newElementId) {
      //below just add an id on the fly to the form element element as this id has an associated css for it
      this.element.id = newElementId;
    }
    this.attach(insertAtStart);
  }

  //Form and ProjectList rendering function -
  private attach(insertAtBeginning: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBeginning ? "afterbegin" : "beforeend",
      this.element
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable {
  private project: Project;

  get persons() {
    if (this.project.people === 1) {
      return `1 person`;
    } else {
      return `${this.project.people} persons`;
    }
  }

  constructor(hostId: string, project: Project) {
    super("single-project", hostId, false, project.id);
    this.project = project;
    this.configure();
    this.renderContent();
  }

  @autobind
  dragStartHandler(event: DragEvent) {
    /*it is not neccessary that 'dataTransfer' object will be available for any type of drag event so that
    is why we have to put ! to let TS know that we will get this object. However for 'dragstart' event we 
    surely have this object available. 'setData()' method on the 'dataTransfer' object takes in two arguments.
    One is the type of data that we are trying to transfer and second one is the data itself.*/
    event.dataTransfer!.setData("text/plain", this.project.id);
    /*here we are specifying that we are moving the data from one point to another and not copying it from one 
    point to another*/
    event.dataTransfer!.effectAllowed = "move";
  }

  @autobind
  dragEndHandler(_: DragEvent) {
  }

  configure() {
    this.element.addEventListener("dragstart", this.dragStartHandler);
    this.element.addEventListener("dragend", this.dragEndHandler);
  }

  renderContent() {
    /*this.element here refers to the base class's this.element which is a list element. 
    All the content below is attached to the hostId which is nothing but a 'ul' with id attribute of 
    'active-project-list' or 'finished-project-list'*/
    this.element.querySelector("h2")!.textContent = this.project.title;
    this.element.querySelector("h3")!.textContent = this.persons;
    this.element.querySelector("p")!.textContent = this.project.description;
  }
}

//ProjectList class
class ProjectList extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget {
  assignedProjects: Project[] = [];

  constructor(private type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects`);
    this.configure();
    /*This will run first as compared to 'renderProjects()' function because 'renderProjects()' function is called
    only when there is a new project submitted*/
    this.renderContent();
  }
  @autobind
  dragOverHandler(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      /*default case of drag/drop event in JS is to not allow any drops so we have to prevent it we do this.
      Doing this will ensure that our drop event is able to recieve this drop on it.*/
      event.preventDefault();
      const listEl = this.element.querySelector("ul")!;
      listEl.classList.add("droppable");
    }
  }

  @autobind
  dropHandler(event: DragEvent) {
    const prjId = event.dataTransfer!.getData("text/plain");
    projectState.moveProject(
      prjId,
      this.type === "active" ? ProjectStatus.Active : ProjectStatus.Finished
    );
  }

  @autobind
  dragLeaveHandler(_: DragEvent) {
    const listEl = this.element.querySelector("ul")!;
    listEl.classList.remove("droppable");
  }

  //It is a convention to add public method first and then private methods-
  configure() {
    this.element.addEventListener("dragover", this.dragOverHandler);
    this.element.addEventListener("drop", this.dropHandler);
    this.element.addEventListener("dragleave", this.dragLeaveHandler);

    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter(prj => {
        if (this.type === "active") {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      });
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
  }

  renderContent() {
    const listId = `${this.type}-project-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + ` PROJECTS`;
  }

  //Render Projects
  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-project-list`
    ) as HTMLUListElement;
    listEl.innerHTML = "";
    for (const prjItem of this.assignedProjects) {
      new ProjectItem(this.element.querySelector("ul")!.id, prjItem);
    }
  }
}

//ProjectInput class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super("project-input", "app", true, "user-input");
    /*as the current document is not yet loaded with HTML so we are not calling querySelector on the document
      object whereas we are calling it in on the form element which is ready to be loaded to the document*/

    this.titleInputElement = this.element.querySelector(
      "#title"
    ) as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      "#description"
    ) as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      "#people"
    ) as HTMLInputElement;
    this.configure();
  }
  //It is a convention to add public method first and then private methods-
  //Event listener attachement to form -
  configure() {
    this.element.addEventListener("submit", this.submitHandler);
  }
  //We don't need it but since our base class has it so we are just including this method so TS don't complain.
  renderContent() {}

  //Gather user input -
  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true
    };
    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 3
    };
    const peopleValidatable: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 5
    };
    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert("Wrong inputs, try again...");
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }
  //Clear Inputs
  private clearInputs() {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }
  //Form handler -
  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, description, people] = userInput;
      projectState.addProject(title, description, people);
      this.clearInputs();
      console.log("inputs recieved", title, description, people);
    }
  }
}

const prjInput = new ProjectInput();
const activePrjInput = new ProjectList("active");
const finishedPrjInput = new ProjectList("finished");
