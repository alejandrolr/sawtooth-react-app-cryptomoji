/* SOLUTION FILE */
import React from 'react';

import { MojiList } from './MojiList';
import { getCollections } from './services/requests';

export class Collection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      publicKey: null,
      collection: null
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const publicKey = nextProps.match.params.publicKey;
    return {
      publicKey
    };
  }

  componentDidMount() {
    this.fetchCollection(this.state.publicKey);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.publicKey !== prevState.publicKey) {
      this.fetchCollection(this.state.publicKey);
    }
  }

  fetchCollection(publicKey) {
    return getCollections(publicKey)
      .then(collection => this.setState({ collection }))
      .catch(err => {
        console.error(`Fetch collection failed for ${publicKey}`, err);
        this.setState({ collection: null });
      });
  }

  render() {
    const { publicKey, collection } = this.state;
    if (!collection) {
      return (
        <div>
          <h3 className="badge badge-light">
            We can't find a collection for public key <code>{publicKey}</code> !
          </h3>
        </div>
      );
    }
    return (
      <div>
        <h4 data-toggle="tooltip" title={publicKey}>
          This is <code>{publicKey.slice(0, 20) + '...' + publicKey.slice(-20)}</code>'s collection!
         </h4>
        <MojiList addresses={collection.moji} />
      </div>
    );
  }
}
