import React, { Component } from "react";
import ExpenseIcon from "./ExpenseIcon";

export default class ExpenseDetail extends Component {
  formatDate(date) {
    if(date){
      const dateParts = date.split("-");
      return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
  }

  UtilityFormatDate(date) {
    
    if(date){
      let mS = ['none','Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
      const dateParts = date.split("-");
      return `${dateParts[2]}-${mS[parseInt(dateParts[1])]}-${dateParts[0]}`;
    }
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
            {this.props.expense.loanAmount ? <div className="progress-bar"><div style={{width:(this.props.expense.paidPercentage||'').toString()}}>{this.props.expense.paidPercentage}</div></div>:''}
            <span className="mdc-list-item__text__secondary">
            {this.props.expense.billAmount ? (this.UtilityFormatDate(this.props.expense.startDate)+' | '+this.UtilityFormatDate(this.props.expense.endDate)):this.formatDate(this.props.expense.date)}
      
          </span>
        </span>
        <span className="mdc-list-item__end-detail" >
        ₹{this.props.expense.loanAmount?this.props.expense.loanAmount:this.props.expense.unit?this.props.expense.billAmount:this.props.expense.amount}
        {
          (this.props.expense.loanAmount)? 
          <span>
          {this.props.expense.paid}
          </span>:""
        }
        </span>
       
        
      </li>
    );
  }
}
