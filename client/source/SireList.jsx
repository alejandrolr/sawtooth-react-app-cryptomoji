/* SOLUTION FILE */
import React from 'react';

import { MojiList } from './MojiList';
import { getSires } from './services/requests';

export class SireList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sires: []
    };
  }

  componentDidMount() {
    getSires()
      .then(sires => {
        this.setState({
          sires: sires.map(sire => {
            sire.isSire = true;
            return sire;
          })
        });
      });
  }

  render() {
    if (this.state.sires.length === 0)
      return <div><h4 className="badge badge-light">No sires found anywhere! You must set one moji as sire</h4></div>;
    else
      return <MojiList moji={this.state.sires} />;
  }
}
