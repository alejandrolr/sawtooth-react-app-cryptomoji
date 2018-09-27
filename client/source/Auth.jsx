/* SOLUTION FILE */
import React from 'react';

import { createKeys, getPublicKey } from './services/signing';
import { submitPayloads } from './services/requests';

export class Auth extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      privateKey: null
    };

    this.handlePrivateKeyChange = this.handlePrivateKeyChange.bind(this);
    this.login = this.login.bind(this);
    this.generateNewPrivateKey = this.generateNewPrivateKey.bind(this);
  }

  // ensures that when <App />'s private key changes (eg, set to null),
  // those changes are received & rendered properly in the rendered <input />
  static getDerivedStateFromProps(nextProps, prevState) {
    return {
      privateKey: nextProps.privateKey
    };
  }

  handlePrivateKeyChange(event) {
    this.setState({ privateKey: event.target.value.trim() });
  }

  createCollection(privateKey) {
    return submitPayloads(privateKey, { action: 'CREATE_COLLECTION' });
  }

  login(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    const { privateKey } = this.state;

    try {
      const publicKey = getPublicKey(privateKey);
      this.props.setPublicKey(publicKey);
      this.props.setPrivateKey(privateKey);
      // rather than checking to see if collection exists and
      // THEN creating it, always attempt to create a collection
      // (to reduce the number of API requests)
      this.createCollection(privateKey)
        .finally(() => {
          this.props.history.push('/collection/' + publicKey);
        });
    } catch (err) {
      alert(
        'Log in failed!\n'
        + "Are you sure that's a valid private key?\n\n"
        + err
      );
    }
  }

  generateNewPrivateKey() {
    const { privateKey } = createKeys();
    // replace contents of <input /> with newly generated private key,
    // then login with that key
    this.setState({ privateKey }, this.login);
  }

  render() {
    const isLoggedIn = !!this.props.privateKey;
    return (
      <div>
        {/* Sign Up Form */}
        <form class="form-inline" onSubmit={this.login}>
          <div class="form-group mb-2">
            <label for="input1">Private Key: {' '}</label>
          </div>
          <div class="form-group mx-sm-3 mb-2">
            <input
              id="input1"
              type="text"
              class="form-control"
              name="privateKey"
              value={this.state.privateKey || ''}
              onChange={this.handlePrivateKeyChange}
            />
          </div>
          <div class="form-group mx-sm-1 mb-2">
            {
              !isLoggedIn && <input class="btn btn-primary" type="submit" value="Login" />
            }
          </div>
        </form>

        {/* Generate New Private Key Submit */}
        <br /> <br />
        {
          !isLoggedIn &&
          (
            <input
              class="btn btn-dark"
              type="button"
              onClick={this.generateNewPrivateKey}
              value="Generate New Key">
            </input>
          )
        }
      </div >
    );
  }
}
