import React, { Component } from "react";
import ExpenseIcon from "./ExpenseIcon";

export default class ExpenseDetail extends Component {
  formatDate(date) {
    const dateParts = date.split("-");
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  }

  render() {
    return (
      <li
        className="mdc-list-item"
        onClick={() => this.props.onSelect(this.props.expense)}
      >
        <ExpenseIcon category={this.props.expense.type?this.props.expense.type:this.props.expense.category} />
        <span className="mdc-list-item__text" style={{width:this.props.expense.paidPercentage ? '40%':''}}   >
          {this.props.expense.type ? this.props.expense.type:this.props.expense.category}
            {this.props.expense.startDate ? <div className="progress-bar"><div style={{width:(this.props.expense.paidPercentage).toString()}}>{this.props.expense.paidPercentage}</div></div>:''}
            <span className="mdc-list-item__text__secondary">
            {this.props.expense.startDate ?'':this.formatDate(this.props.expense.date)}
             {this.props.expense.category && this.props.expense.description
              ? ` ${this.props.expense.description.replace(/^(.{14}).+/, "₹1…")}`
              : ""}
          </span>
        </span>
        <span className="mdc-list-item__end-detail">
        ₹{this.props.expense.total?this.props.expense.total:this.props.expense.amount}
        </span>
      </li>
    );
  }
}
