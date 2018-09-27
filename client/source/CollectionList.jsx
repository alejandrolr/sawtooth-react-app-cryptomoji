/* SOLUTION FILE */
import React from 'react';
import { Link } from 'react-router-dom';

import { getCollections } from './services/requests';

export class CollectionList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collections: null
    };
  }

  componentDidMount() {
    this.fetchcollections();
  }

  fetchcollections(publicKey) {
    return getCollections()
      .then(collections => this.setState({ collections }))
      .catch(err => {
        console.error('Fetch collections failed', err);
      });
  }

  render() {
    const { collections } = this.state;
    if (!collections) {
      return <div><h4 className="badge badge-light">No collections found anywhere!</h4></div>;
    }
    return (
      <div>
        <h2>Collections!</h2>
        <table className="table table-striped">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Available Collections </th>
            </tr>
          </thead>
          <tbody>
            {collections.map((collection, i) => (
              <tr key={i} >
                <th scope="row" >{i}</th>
                {
                  collection.key === this.props.publicKey ? (
                    <td> <Link to={'/collection/' + collection.key}>{collection.key}</Link> 👍Yours!</td>
                  ) : (
                      <td> <Link to={'/collection/' + collection.key}>{collection.key}</Link></td>
                    )
                }
              </tr>
            ))}
          </tbody>
        </table >
      </div >
    );
  }
}
