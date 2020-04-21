//Project Type 
enum ProjectStatus {
  Active,
  Finished
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ){}
}

//Project State Management - A singleton class
type Listener = (item: Project[]) => void;

class ProjectState {
  private projects: Project[] = [];
  private static instance: ProjectState; /*this property is made static because a static method 'getInstance' is 
  using it*/
  private listeners: Listener[] = [];

  //Returning a singleton instance
  static getInstance(){
    if(this.instance){
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title:string, description:string, numOfPeople:number){
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    for(const listenerFn of this.listeners){
      listenerFn(this.projects.slice()); //slice returns the copy of the array so original array is not modified
    }
  }
  
  addListener(listenerFn: Listener){
    this.listeners.push(listenerFn);
  }
}

const projectState = ProjectState.getInstance();


//Form Validation 
interface Validatable{
  value: string | number, 
  required?: boolean,
  minLength?: number, 
  maxLength?: number, 
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
    typeof validatableInput.value === 'string'
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength;
  }
  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === 'string'
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength;
  }
  if (
    validatableInput.min != null &&
    typeof validatableInput.value === 'number'
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }
  if (
    validatableInput.max != null &&
    typeof validatableInput.value === 'number'
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }
  return isValid;
}

function autobind(_: any, _2: string, descriptor: PropertyDescriptor){
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
      configurable: true,
      enumerable: false,
      get() {
          const boundFn = originalMethod.bind(this);
          return boundFn;
      }
  }
  return adjDescriptor;
}

//ProjectList class
class ProjectList {

  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLElement;
  assignedProjects: Project[] = [];

  constructor(private type: 'active' | 'finished'){
    
    this.templateElement = document.getElementById('project-list')! as HTMLTemplateElement;
    this.hostElement = document.getElementById('app')! as HTMLDivElement;
    const importedNode = document.importNode(this.templateElement.content, true);
    
    this.element = importedNode.firstElementChild as HTMLElement;  
    this.element.id = `${this.type}-projects`;
    
    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter((prj) => {
        if(this.type === 'active'){
         return prj.status === ProjectStatus.Active
        }
        return prj.status === ProjectStatus.Finished
      })
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
    
    this.attach();
    /*This will run first as compared to 'renderProjects()' function because 'renderProjects()' function is called
    only when there is a new project submitted*/
    this.renderContent();
  }
  
  //Render Projects 
  private renderProjects(){
    const listEl = document.getElementById(`${this.type}-project-list`) as HTMLUListElement;
    listEl.innerHTML = '';
    for(const prjItem of this.assignedProjects){
      const listItem = document.createElement('li');
      listItem.textContent = prjItem.title;
      listEl.appendChild(listItem);
    }
  }
  //ProjectList rendering function -
  private attach(){
    this.hostElement.insertAdjacentElement('beforeend', this.element);
  }
  
  private renderContent(){
    const listId = `${this.type}-project-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + `PROJECTS`;
  }
  
}


//ProjectInput class
class ProjectInput {
  
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLFormElement;
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;
  
  constructor(){
      /*returns a template html element that has a document fragment inside of it which contains a form. 
      The DocumentFragment interface represents a minimal document object that has no parent. It is used as a
      lightweight version of Document that stores a segment of a document structure comprised of nodes just 
      like a standard document. The key difference is due to the fact that the document fragment isn't part 
      of the active document tree structure. Changes made to the fragment don't affect the document (even on 
      reflow) or incur any performance impact when changes are made.
      Event Target -> Node -> DocumentFragment
      */
      this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement;
      this.hostElement = document.getElementById('app')! as HTMLDivElement;
      /*
      The Document object's importNode() method creates a copy of a Node or DocumentFragment from another document,
      to be inserted into the current document later. The imported node is not yet included in the document tree. 
      To include it, you need to call an insertion method such as appendChild() or insertBefore() with a node that 
      is currently in the document tree. Unlike document.adoptNode(), the original node is not removed from its 
      original document. The imported node is a clone of the original.
      */ 
      const importedNode = document.importNode(this.templateElement.content, true);
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
      this.element = importedNode.firstElementChild as HTMLFormElement;   
      //below just add an id on the fly to the form element element as this id has an associated css for it 
      this.element.id = 'user-input';
      /*as the current document is not yet loaded with HTML so we are not calling querySelector on the document
      object whereas we are calling it in on the form element which is ready to be loaded to the document*/ 
      this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
      this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
      this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;
      this.configure();
      this.attach();
  }   
  //Form rendering function -
  private attach(){
      this.hostElement.insertAdjacentElement('afterbegin', this.element);
  }
  //Gather user input -
  private gatherUserInput() : [string, string, number] | void{
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
      if(
          !validate(titleValidatable) ||
          !validate(descriptionValidatable) ||
          !validate(peopleValidatable)
        ){
          alert('Wrong inputs, try again...');
          return;
        }
      
      else{
          return [enteredTitle, enteredDescription, +enteredPeople];          
      }  
  }
  //Clear Inputs 
  private clearInputs(){
      this.titleInputElement.value = '';
      this.descriptionInputElement.value = '';
      this.peopleInputElement.value = '';
  }
  //Form handler -
  @autobind
  private submitHandler(event: Event) {
      event.preventDefault();
      const userInput = this.gatherUserInput();
      if(Array.isArray(userInput)){
          const [title, description, people] = userInput;
          projectState.addProject(title, description, people);
          this.clearInputs();
          console.log('inputs recieved', title, description, people);
      }
  }
  //Event listener attachement to form -
  private configure(){
      this.element.addEventListener('submit', this.submitHandler);
  }
}

const prjInput = new ProjectInput();
const activePrjInput = new ProjectList('active');
const finishedPrjInput = new ProjectList('finished');