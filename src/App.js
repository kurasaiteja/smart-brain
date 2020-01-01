import React, { Component } from 'react';
import Particles from 'react-particles-js';
import Navigation from './components/Navigation/Navigation';
import Logo from './components/Logo/Logo';
import Rank from './components/Rank/Rank';
import SignIn from './components/SignIn/SignIn';
import Register from './components/Register/Register';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Clarifai from 'clarifai'
import './App.css';

const app = new Clarifai.App({
 apiKey: 'a148ce32ba3443d3ab8a8cfc9525d67b'
});

const particlesOptions = {
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        value_area: 800
      }
    }
  }
}

const initialState = {
      input: '',
      imageURL: '',
      box: {},
      route: 'signin',
      isSignedIn: false,
      user:{
        id:'',
        name: '',
        email: '',
        password: '',
        entries: 0,
        joined: '' 
      }
}


class App extends Component {

  constructor() {
    super();
    this.state=initialState;
    }

  loadUser = (data) =>{
      this.setState({user:{
        id: data.id,
        name: data.name,
        email: data.email,
        password: data.password,
        entries: data.entries,
        joined: data.joined
      
      }})
  }  


  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    }
  }

  displayFaceBox = (box) => {
    this.setState({box: box});
  }

  onInputChange = (event) => {
    this.setState({input : event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageURL: this.state.input});
    app.models
      .predict(
        Clarifai.FACE_DETECT_MODEL,
        this.state.input)
      .then(response => {
        if (response) {
          fetch('http://localhost:3000/image', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, { entries: count}))
            })

        }
        this.displayFaceBox(this.calculateFaceLocation(response))
      })
      .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    if(route === 'signout')
    {
      this.setState(initialState);
    } else if(route === 'home')
    {
      this.setState({isSignedIn: true});
    }
    this.setState({route: route});
  }

  

  render(){
    const { imageURL, route, box, isSignedIn } = this.state;
  return (
    <div className="App">
    <Particles className='particles'
      params={particlesOptions}
      />
      <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
      { route === 'home'
        ? <div>
            <Logo />
            <Rank name={this.state.user.name} entries={this.state.user.entries}/>
            <ImageLinkForm 
            onInputChange={this.onInputChange} 
            onButtonSubmit={this.onButtonSubmit}
            />
            <FaceRecognition box={box} imageURL={imageURL} />
          </div>
        : (
           route === 'signin'
           ? <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange} /> 
           : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} /> 
            
          )
      }
    </div>
  );
  }
}

export default App;
